package com.aivideodetector

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Rect
import org.tensorflow.lite.DataType
import org.tensorflow.lite.Interpreter
import java.io.Closeable
import java.io.FileInputStream
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel

/**
 * Runs the on-device AI-video detector.
 *
 * Model contract (see README): `assets/ai_video_detector.tflite`, float32 input
 * [1, H, W, 3] RGB scaled to 0..1, output either [1, 1] (probability of AI) or
 * [1, 2] (softmax [real, ai]). Weights may be INT8-quantized.
 */
class AiVideoClassifier(context: Context) : Closeable {

    private val interpreter: Interpreter? = loadModel(context)?.let { model ->
        Interpreter(model, Interpreter.Options().setNumThreads(2))
    }

    private val inputHeight: Int
    private val inputWidth: Int
    private val input: ByteBuffer?
    private val pixels: IntArray
    private val output: Array<FloatArray>

    init {
        val interp = interpreter
        if (interp != null) {
            val inTensor = interp.getInputTensor(0)
            require(inTensor.dataType() == DataType.FLOAT32) { "Model input must be float32" }
            val shape = inTensor.shape() // [1, H, W, 3]
            inputHeight = shape[1]
            inputWidth = shape[2]
            input = ByteBuffer.allocateDirect(4 * inputHeight * inputWidth * 3)
                .order(ByteOrder.nativeOrder())
            pixels = IntArray(inputHeight * inputWidth)
            output = arrayOf(FloatArray(interp.getOutputTensor(0).shape().last()))
        } else {
            inputHeight = 0
            inputWidth = 0
            input = null
            pixels = IntArray(0)
            output = arrayOf(FloatArray(0))
        }
    }

    val isAvailable: Boolean get() = interpreter != null

    /**
     * Probability (0..1) that the video region of [screen] is AI-generated,
     * or null when no model is installed.
     */
    fun score(screen: Bitmap): Float? {
        val interp = interpreter ?: return null
        val buffer = input ?: return null

        val crop = videoRegion(screen)
        val cropped = Bitmap.createBitmap(screen, crop.left, crop.top, crop.width(), crop.height())
        val scaled = Bitmap.createScaledBitmap(cropped, inputWidth, inputHeight, true)
        scaled.getPixels(pixels, 0, inputWidth, 0, 0, inputWidth, inputHeight)
        if (scaled !== cropped) scaled.recycle()
        if (cropped !== screen) cropped.recycle()

        buffer.rewind()
        for (p in pixels) {
            buffer.putFloat(((p shr 16) and 0xFF) / 255f)
            buffer.putFloat(((p shr 8) and 0xFF) / 255f)
            buffer.putFloat((p and 0xFF) / 255f)
        }
        buffer.rewind()

        interp.run(buffer, output)
        val out = output[0]
        return if (out.size >= 2) out[1] else out[0]
    }

    override fun close() {
        interpreter?.close()
    }

    companion object {
        private const val MODEL_ASSET = "ai_video_detector.tflite"

        fun isModelBundled(context: Context): Boolean =
            context.assets.list("")?.contains(MODEL_ASSET) == true

        /**
         * The part of the screen that is usually video, without the app's top bar,
         * caption/like buttons and our own badge (which sits at the top).
         */
        fun videoRegion(screen: Bitmap): Rect {
            val top = (screen.height * 0.12f).toInt()
            val bottom = (screen.height * 0.80f).toInt()
            val right = (screen.width * 0.85f).toInt() // skip TikTok/Reels side buttons
            return Rect(0, top, right, bottom)
        }

        private fun loadModel(context: Context): MappedByteBuffer? = try {
            context.assets.openFd(MODEL_ASSET).use { fd ->
                FileInputStream(fd.fileDescriptor).channel.use { channel ->
                    channel.map(FileChannel.MapMode.READ_ONLY, fd.startOffset, fd.declaredLength)
                }
            }
        } catch (e: IOException) {
            null
        }
    }
}
