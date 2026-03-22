# MoveCalibrate VAE Training Pipeline

Variational Autoencoder for learned movement quality scoring.

## Pipeline

1. **`extract_features.py`** — Extract 30-feature biomechanical vectors from motion data
2. **`train_vae.py`** — Train VAE on feature sequences, export reconstruction error as quality signal
3. **`export_tfjs.py`** — Convert trained model to TensorFlow.js format for on-device inference

## Architecture

The VAE learns a latent representation of "good movement" from exercise-specific feature sequences. At inference time, reconstruction error serves as an anomaly score: movements that deviate from learned good form produce higher reconstruction error, which maps to lower quality scores.

This replaces the rule-based quality scoring (distance from ideal feature ranges) with a data-driven alternative. Both approaches are valid — the rule-based system is more interpretable for clinicians, while the VAE generalizes better to novel movement patterns.

## Output

Trained model exports to `public/models/vae.json` for client-side TF.js inference.
