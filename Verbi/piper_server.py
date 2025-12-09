import subprocess
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.responses import FileResponse
import os

app = FastAPI()


class SynthesisRequest(BaseModel):
    text: str

@app.post("/synthesize/")
def synthesize(request: SynthesisRequest):
    output_file = "output.wav"
    # Windows: use .exe, Linux/Mac: no extension
    import platform
    if platform.system() == "Windows":
        piper_executable = "./piper/piper.exe"
    else:
        piper_executable = "./piper/piper"
    
    model_path = "en_US-lessac-high.onnx" #path to the .onnx file

    # Check if binary exists (Windows doesn't need X_OK check)
    if not os.path.isfile(piper_executable):
        raise HTTPException(
            status_code=500, 
            detail=f"Piper binary not found at: {piper_executable}. "
                   f"Please download from https://github.com/rhasspy/piper/releases"
        )

    
    if not os.path.exists(model_path):
        raise HTTPException(status_code=500, detail="Piper model file not found!")


    command = [piper_executable, "--model", model_path, "--output_file", output_file]

    try:
        
        process = subprocess.run(command, input=request.text.encode(), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

        
        if os.path.exists(output_file):
            return FileResponse(output_file, media_type="audio/wav")
        else:
            raise HTTPException(status_code=500, detail="Piper did not generate an audio file.")
    
    except subprocess.CalledProcessError as e:
        error_message = e.stderr.decode() if e.stderr else "Unknown error"
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {error_message}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
