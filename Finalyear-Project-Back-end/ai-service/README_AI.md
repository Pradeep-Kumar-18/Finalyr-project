# HemoVision AI - Inference Service Setup

## Production-Ready Structure
- `app.py`: Main Flask application with integrated dependency validation.
- `requirements.txt`: Pin-pointed dependencies for stable execution.
- `models/`: Directory containing `.h5` model files.
- `start_ai.bat`: Windows launcher that manages the virtual environment.

## Installation & Setup (Step-by-Step)

1. **Navigate to the AI Service directory:**
   ```powershell
   cd "Finalyear-Project-Back-end\ai-service"
   ```

2. **Run the Automated Launcher:**
   This script will automatically create a virtual environment, install all missing packages (NumPy, TensorFlow, etc.), and start the service.
   ```powershell
   .\start_ai.bat
   ```

3. **Verify Execution:**
   - The console will display `[OK] Eye model loaded`, etc.
   - The service will start on `http://localhost:5001` (or your configured port).

## Troubleshooting

### "ModuleNotFoundError"
If you see this error, you are likely running the file with the wrong Python interpreter. **Always** use `start_ai.bat` or activate the environment first:
```powershell
.\venv\Scripts\activate
python app.py
```

### Dependency Conflicts
If packages fail to install, try a clean reset:
1. Delete the `venv` folder.
2. Run `.\start_ai.bat` again.

## Optimization Notes
- **TensorFlow:** Configured to use minimal threads to prevent OOM (Out Of Memory) on limited resource environments like Render or local laptops.
- **Memory:** Explicit garbage collection (`gc.collect()`) is triggered after model loading and after each prediction.
