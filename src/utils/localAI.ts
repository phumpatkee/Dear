import { toByteArray } from 'base64-js';
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import {
  InferenceSession,
  Tensor,
} from 'onnxruntime-react-native';

declare const require: any;

// =====================================================
// MODEL FILES
// =====================================================

const MODEL_ASSET = require(
  '../../assets/skinscan_resnet18.onnx'
);

const MODEL_DATA_ASSET = require(
  '../../assets/skinscan_resnet18.onnx.data'
);

// =====================================================
// CLASS LABELS
// =====================================================

export const CLASS_LABELS = [
  'benign',
  'melanoma',
  'nevus',
] as const;

// =====================================================
// SESSION
// =====================================================

let session: InferenceSession | null = null;

// =====================================================
// LOAD MODEL
// =====================================================

async function getModelSession(): Promise<InferenceSession> {

  if (session) {
    return session;
  }

  console.log('====================================');
  console.log('SKINSCAN AI');
  console.log('Loading ONNX model...');
  console.log('====================================');

  try {

    // -------------------------------------------------
    // Load ONNX
    // -------------------------------------------------

    const modelAssets =
      await Asset.loadAsync(MODEL_ASSET);

    const modelAsset =
      modelAssets[0];

    if (!modelAsset) {
      throw new Error(
        'ไม่พบ skinscan_resnet18.onnx'
      );
    }

    if (!modelAsset.localUri) {
      await modelAsset.downloadAsync();
    }

    const modelUri =
      modelAsset.localUri ?? modelAsset.uri;

    console.log(
      'MODEL URI:',
      modelUri
    );

    // -------------------------------------------------
    // Load external data
    // -------------------------------------------------

    const dataAssets =
      await Asset.loadAsync(
        MODEL_DATA_ASSET
      );

    const dataAsset =
      dataAssets[0];

    if (!dataAsset) {
      throw new Error(
        'ไม่พบ skinscan_resnet18.onnx.data'
      );
    }

    if (!dataAsset.localUri) {
      await dataAsset.downloadAsync();
    }

    const dataUri =
      dataAsset.localUri ?? dataAsset.uri;

    console.log(
      'DATA URI:',
      dataUri
    );

    // -------------------------------------------------
    // Read external data
    // -------------------------------------------------

    console.log(
      'Reading external ONNX data...'
    );

    const response =
      await fetch(dataUri);

    if (!response.ok) {
      throw new Error(
        `อ่าน ONNX data ไม่สำเร็จ: HTTP ${response.status}`
      );
    }

    const buffer =
      await response.arrayBuffer();

    const externalData =
      new Uint8Array(buffer);

    console.log(
      'External data bytes:',
      externalData.byteLength
    );

    if (
      externalData.byteLength < 1000000
    ) {
      throw new Error(
        `ไฟล์ ONNX data เล็กผิดปกติ: ${externalData.byteLength} bytes`
      );
    }

    // -------------------------------------------------
    // Create session
    // -------------------------------------------------

    console.log(
      'Creating ONNX session...'
    );

    const newSession =
      await InferenceSession.create(
        modelUri,
        {
          externalData: [
            {
              path:
                'skinscan_resnet18.onnx.data',

              data:
                externalData,
            },
          ],
        }
      );

    session =
      newSession;

    console.log(
      '===================================='
    );

    console.log(
      'ONNX MODEL LOADED SUCCESSFULLY'
    );

    console.log(
      'Input names:',
      session.inputNames
    );

    console.log(
      'Output names:',
      session.outputNames
    );

    console.log(
      '===================================='
    );

    return session;

  } catch (error) {

    console.error(
      'MODEL LOAD ERROR:',
      error
    );

    throw error;
  }
}

// =====================================================
// SOFTMAX
// =====================================================

function softmax(
  logits: number[]
): number[] {

  if (
    !logits ||
    logits.length === 0
  ) {
    throw new Error(
      'ONNX output ไม่มีข้อมูล'
    );
  }

  const maxLogit =
    Math.max(...logits);

  const expValues =
    logits.map(
      (value) =>
        Math.exp(
          value - maxLogit
        )
    );

  const sum =
    expValues.reduce(
      (a, b) => a + b,
      0
    );

  if (
    !Number.isFinite(sum) ||
    sum === 0
  ) {
    throw new Error(
      'ไม่สามารถคำนวณ Softmax ได้'
    );
  }

  return expValues.map(
    (value) =>
      value / sum
  );
}

// =====================================================
// PREDICT IMAGE
// =====================================================

export async function predictImage(
  imageUri: string
) {

  try {

    // =================================================
    // STEP 1 - MODEL
    // =================================================

    console.log(
      '[AI] STEP 1 - Loading model'
    );

    const ortSession =
      await getModelSession();

    console.log(
      '[AI] STEP 1 OK'
    );

    // =================================================
    // STEP 2 - IMAGE
    // =================================================

    console.log(
      '[AI] STEP 2 - Preparing image'
    );

    if (
      !imageUri ||
      typeof imageUri !== 'string'
    ) {
      throw new Error(
        'imageUri ไม่ถูกต้อง'
      );
    }

    // ใช้ namespace import เพื่อป้องกัน
    // ImageManipulator undefined
    const manipulated =
      await ImageManipulator.manipulateAsync(
        imageUri,

        [
          {
            resize: {
              width: 224,
              height: 224,
            },
          },
        ],

        {
          format:
            ImageManipulator.SaveFormat.JPEG,

          compress: 1,

          base64: true,
        }
      );

    console.log(
      '[AI] STEP 2 OK'
    );

    // =================================================
    // STEP 3 - BASE64
    // =================================================

    if (
      !manipulated ||
      !manipulated.base64
    ) {
      throw new Error(
        'ImageManipulator ไม่ได้คืน Base64'
      );
    }

    console.log(
      '[AI] STEP 3 - Decoding JPEG'
    );

    const jpegBytes =
      toByteArray(
        manipulated.base64
      );

    if (
      !jpegBytes ||
      jpegBytes.length === 0
    ) {
      throw new Error(
        'JPEG bytes ว่าง'
      );
    }

    // =================================================
    // STEP 4 - JPEG DECODE
    // =================================================

    if (
      !jpeg ||
      typeof jpeg.decode !== 'function'
    ) {
      throw new Error(
        'jpeg-js decode function ไม่พร้อมใช้งาน'
      );
    }

    const decoded =
      jpeg.decode(
        jpegBytes,
        {
          useTArray: true,
        }
      );

    if (
      !decoded ||
      !decoded.data
    ) {
      throw new Error(
        'ไม่สามารถ decode JPEG ได้'
      );
    }

    console.log(
      '[AI] STEP 4 OK:',
      decoded.width,
      'x',
      decoded.height
    );

    // =================================================
    // STEP 5 - IMAGE SIZE
    // =================================================

    if (
      decoded.width !== 224 ||
      decoded.height !== 224
    ) {
      throw new Error(
        `ภาพมีขนาด ${decoded.width}x${decoded.height} แต่ต้องเป็น 224x224`
      );
    }

    // =================================================
    // STEP 6 - CREATE TENSOR
    // =================================================

    console.log(
      '[AI] STEP 5 - Creating tensor'
    );

    const totalPixels =
      224 * 224;

    const inputData =
      new Float32Array(
        3 * totalPixels
      );

    // ImageNet normalization
    const mean = [
      0.485,
      0.456,
      0.406,
    ];

    const std = [
      0.229,
      0.224,
      0.225,
    ];

    // -------------------------------------------------
    // RGBA -> RGB
    // HWC -> CHW
    // Normalize
    // -------------------------------------------------

    for (
      let i = 0;
      i < totalPixels;
      i++
    ) {

      const rgbaIndex =
        i * 4;

      const r =
        decoded.data[
          rgbaIndex
        ] / 255;

      const g =
        decoded.data[
          rgbaIndex + 1
        ] / 255;

      const b =
        decoded.data[
          rgbaIndex + 2
        ] / 255;

      // R
      inputData[i] =
        (r - mean[0]) /
        std[0];

      // G
      inputData[
        totalPixels + i
      ] =
        (g - mean[1]) /
        std[1];

      // B
      inputData[
        totalPixels * 2 + i
      ] =
        (b - mean[2]) /
        std[2];
    }

    const inputTensor =
      new Tensor(
        'float32',
        inputData,
        [1, 3, 224, 224]
      );

    console.log(
      '[AI] STEP 5 OK - Tensor created'
    );

    // =================================================
    // STEP 7 - INPUT / OUTPUT
    // =================================================

    const inputName =
      ortSession.inputNames[0];

    const outputName =
      ortSession.outputNames[0];

    if (!inputName) {
      throw new Error(
        'ONNX ไม่มี input name'
      );
    }

    if (!outputName) {
      throw new Error(
        'ONNX ไม่มี output name'
      );
    }

    console.log(
      '[AI] INPUT:',
      inputName
    );

    console.log(
      '[AI] OUTPUT:',
      outputName
    );

    // =================================================
    // STEP 8 - INFERENCE
    // =================================================

    console.log(
      '[AI] STEP 6 - Running inference'
    );

    const outputs =
      await ortSession.run(
        {
          [inputName]:
            inputTensor,
        },

        [
          outputName,
        ]
      );

    console.log(
      '[AI] STEP 6 OK - Inference completed'
    );

    // =================================================
    // STEP 9 - OUTPUT
    // =================================================

    const outputTensor =
      outputs[
        outputName
      ];

    if (
      !outputTensor
    ) {
      throw new Error(
        `ไม่พบ output: ${outputName}`
      );
    }

    if (
      !outputTensor.data
    ) {
      throw new Error(
        'Output tensor ไม่มี data'
      );
    }

    const logits =
      Array.from(
        outputTensor.data as
          Float32Array
      );

    console.log(
      '[AI] LOGITS:',
      logits
    );

    if (
      logits.length !== 3
    ) {
      throw new Error(
        `Model ต้องคืน 3 classes แต่ได้ ${logits.length}`
      );
    }

    // =================================================
    // STEP 10 - SOFTMAX
    // =================================================

    const probabilities =
      softmax(logits);

    console.log(
      '[AI] PROBABILITIES:',
      probabilities
    );

    // =================================================
    // STEP 11 - BEST CLASS
    // =================================================

    let bestIndex =
      0;

    for (
      let i = 1;
      i < probabilities.length;
      i++
    ) {

      if (
        probabilities[i] >
        probabilities[bestIndex]
      ) {
        bestIndex =
          i;
      }
    }

    const confidence =
      probabilities[
        bestIndex
      ];

    const prediction =
      CLASS_LABELS[
        bestIndex
      ] ??
      `class_${bestIndex}`;

    // =================================================
    // STEP 12 - RISK
    // =================================================

    let riskLevel:
      | 'Urgent'
      | 'Normal'
      | 'Uncertain';

    if (
      confidence < 0.60
    ) {

      riskLevel =
        'Uncertain';

    } else if (
      prediction ===
      'melanoma'
    ) {

      riskLevel =
        'Urgent';

    } else {

      riskLevel =
        'Normal';
    }

    // =================================================
    // FINAL RESULT
    // =================================================

    const result = {

      prediction,

      confidence,

      risk_level:
        riskLevel,

      class_index:
        bestIndex,

      probabilities: {

        benign:
          probabilities[0] ?? 0,

        melanoma:
          probabilities[1] ?? 0,

        nevus:
          probabilities[2] ?? 0,
      },
    };

    console.log(
      '===================================='
    );

    console.log(
      '[AI] RESULT:',
      result
    );

    console.log(
      '===================================='
    );

    return result;

  } catch (error) {

    console.error(
      '===================================='
    );

    console.error(
      '[AI] PREDICTION FAILED'
    );

    console.error(
      error
    );

    console.error(
      '===================================='
    );

    throw error;
  }
}