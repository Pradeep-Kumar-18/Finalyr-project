import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Sequential
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from sklearn.utils.class_weight import compute_class_weight

# 1. Paths
train_dir = "palm/train"
test_dir = "palm/test"
model_dir = "models"

os.makedirs(model_dir, exist_ok=True)

# 2. Settings
IMG_SIZE = (224, 224)
BATCH_SIZE = 8   
EPOCHS_STAGE1 = 10
EPOCHS_STAGE2 = 25

# 3. Data generators
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=30,
    zoom_range=0.3,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.15,
    horizontal_flip=True,
    fill_mode="nearest"
)

test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=True
)

test_generator = test_datagen.flow_from_directory(
    test_dir,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="binary",
    shuffle=False
)

# 4. Class weights
class_labels = train_generator.classes
class_weights_array = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(class_labels),
    y=class_labels
)
class_weights = dict(enumerate(class_weights_array))

# 5. Model
base_model = MobileNetV2(weights="imagenet", include_top=False, input_shape=(224, 224, 3))
base_model.trainable = False

model = Sequential([
    base_model,
    GlobalAveragePooling2D(),
    Dense(128, activation="relu"),
    Dropout(0.5),
    Dense(1, activation="sigmoid")
])

# 6. Stage 1
print("\n--- Stage 1: Training Top Layers ---")
model.compile(optimizer=Adam(learning_rate=0.001), loss="binary_crossentropy", metrics=["accuracy"])

callbacks = [
    EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
    ModelCheckpoint(filepath=os.path.join(model_dir, "palm_model_refining.h5"), monitor="val_accuracy", save_best_only=True, verbose=1)
]

model.fit(train_generator, validation_data=test_generator, epochs=EPOCHS_STAGE1, class_weight=class_weights, callbacks=callbacks)

# 7. Stage 2 Fine-Tuning
print("\n--- Stage 2: Fine-Tuning Base Model ---")
base_model.trainable = True
fine_tune_at = 100 
for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

model.compile(optimizer=Adam(learning_rate=0.00001), loss="binary_crossentropy", metrics=["accuracy"])

callbacks_fine = [
    EarlyStopping(monitor="val_loss", patience=7, restore_best_weights=True),
    ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=0.000001),
    ModelCheckpoint(filepath=os.path.join(model_dir, "palm_model_final.h5"), monitor="val_accuracy", save_best_only=True, verbose=1)
]

model.fit(train_generator, validation_data=test_generator, epochs=EPOCHS_STAGE2, class_weight=class_weights, callbacks=callbacks_fine)

model.save(os.path.join(model_dir, "palm_model_final.h5"))
print("Improved Palm model saved successfully.")