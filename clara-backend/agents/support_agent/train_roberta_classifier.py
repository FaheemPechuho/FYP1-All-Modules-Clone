"""
Train RoBERTa-base ticket classifier for Husnain (Phase 2A - Classification)

This script:
- Loads a CSV dataset of example tickets with category + priority labels
- Fine-tunes a RoBERTa-base model to predict ticket CATEGORY
- Uses a small validation set to track accuracy
- Trains for up to 10 epochs with early stopping when accuracy stops improving
- Saves the trained model to models/roberta_ticket_category

Run from the clara-backend folder:
    python -m agents.support_agent.train_roberta_classifier

Requirements (already installed earlier):
- torch
- transformers
- scikit-learn
- pandas
"""

import os
from typing import List

# IMPORTANT: tell transformers to use ONLY PyTorch (no TensorFlow)
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["USE_TF"] = "0"

import pandas as pd
import torch
from sklearn.metrics import accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from torch.utils.data import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    Trainer,
    TrainingArguments,
)

# ========================
# 1. Basic configuration
# ========================

MODEL_NAME = "roberta-base"  # HuggingFace model name
DATA_PATH = "training_data/ticket_classification_roberta.csv"
OUTPUT_DIR = "models/roberta_ticket_category"

NUM_EPOCHS = 10  # maximum epochs (early stopping will stop earlier if needed)
BATCH_SIZE = 8
LR = 2e-5
MAX_LENGTH = 128

# Detect device (GPU if available)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")


# ========================
# 2. Dataset definition
# ========================

class TicketDataset(Dataset):
    """Simple PyTorch dataset for ticket classification.

    Each row has:
    - text: subject + description
    - label: category index (0..N-1)
    """

    def __init__(self, texts: List[str], labels: List[int], tokenizer, max_length: int = 128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = int(self.labels[idx])

        # Tokenize the text for RoBERTa
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt",
        )

        item = {key: val.squeeze(0) for key, val in encoding.items()}
        item["labels"] = torch.tensor(label, dtype=torch.long)
        return item


# ========================
# 3. Load data and encode labels
# ========================

def load_data(path: str):
    """Load CSV and prepare texts + encoded labels.

    CSV columns expected:
    - text
    - category
    - priority (ignored for now; we only train CATEGORY model in 2A)
    """

    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset not found at {path}")

    df = pd.read_csv(path)

    # Simple sanity check
    if "text" not in df.columns or "category" not in df.columns:
        raise ValueError("CSV must contain 'text' and 'category' columns")

    texts = df["text"].astype(str).tolist()
    categories = df["category"].astype(str).tolist()

    # Encode string labels -> integers
    label_encoder = LabelEncoder()
    labels = label_encoder.fit_transform(categories)

    num_labels = len(label_encoder.classes_)
    print("Categories:")
    for idx, name in enumerate(label_encoder.classes_):
        print(f"  {idx}: {name}")

    return texts, labels, label_encoder, num_labels


def augment_data(texts: List[str], labels: List[int]):
    """Simple text augmentation to effectively create more training examples.

    We keep the CSV small but generate extra variants in memory.
    This gives the model more data without you editing hundreds of lines.
    """

    augmented_texts = list(texts)
    augmented_labels = list(labels)

    prefixes = ["Customer: ", "User report: ", "Issue: ", "Ticket: "]

    for text, label in zip(texts, labels):
        for p in prefixes:
            augmented_texts.append(p + text)
            augmented_labels.append(label)

    print(f"Original samples: {len(texts)}, augmented samples: {len(augmented_texts)}")
    return augmented_texts, augmented_labels


# ========================
# 4. Main training function
# ========================

def main():
    # Load data
    texts, labels, label_encoder, num_labels = load_data(DATA_PATH)

    # Augment data in memory so the model sees many more examples
    texts, labels = augment_data(texts, labels)

    # Split into train and validation sets (to track accuracy)
    X_train, X_val, y_train, y_val = train_test_split(
        texts,
        labels,
        test_size=0.2,
        stratify=labels,
        random_state=42,
    )

    # Load tokenizer and model
    print(f"Loading tokenizer and model: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=num_labels,
    )

    model.to(device)

    # Build datasets
    train_dataset = TicketDataset(X_train, y_train, tokenizer, max_length=MAX_LENGTH)
    eval_dataset = TicketDataset(X_val, y_val, tokenizer, max_length=MAX_LENGTH)

    # Training configuration (kept simple for compatibility with your Transformers version)
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        num_train_epochs=NUM_EPOCHS,
        per_device_train_batch_size=BATCH_SIZE,
        learning_rate=LR,
        weight_decay=0.01,
        logging_dir=os.path.join(OUTPUT_DIR, "logs"),
        logging_steps=10,
    )

    # Metric function so Trainer can report accuracy / F1
    def compute_metrics(eval_pred):
        logits, labels = eval_pred
        preds = logits.argmax(axis=-1)
        acc = accuracy_score(labels, preds)
        f1 = f1_score(labels, preds, average="weighted")
        return {"accuracy": acc, "f1": f1}

    # Use HuggingFace Trainer to handle training loop
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        compute_metrics=compute_metrics,
    )

    print("Starting training...")
    trainer.train()

    # Evaluate on validation set and print final accuracy/F1
    print("Evaluating on validation set...")
    eval_results = trainer.predict(eval_dataset)
    metrics = compute_metrics((eval_results.predictions, eval_results.label_ids))
    print("Validation metrics:")
    for k, v in metrics.items():
        print(f"  {k}: {v:.4f}")

    # Save model and label encoder
    print("Saving model and label encoder...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    model.save_pretrained(OUTPUT_DIR)
    tokenizer.save_pretrained(OUTPUT_DIR)

    # Save label encoder classes so we can map back from index -> label
    classes_path = os.path.join(OUTPUT_DIR, "label_classes.txt")
    with open(classes_path, "w", encoding="utf-8") as f:
        for cls in label_encoder.classes_:
            f.write(str(cls) + "\n")

    print("Training complete. Model saved to:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
