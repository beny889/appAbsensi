package com.absensi.presentation.camera

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import android.util.AttributeSet
import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator

/**
 * Custom view that displays a face frame with progress indicator
 * Shows segmented arc around the oval based on registration progress
 * Corner marks change color based on face detection state
 * Shows animated checkmark on pose completion
 */
class FaceFrameProgressView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    /**
     * Corner state for face detection feedback
     */
    enum class CornerState {
        DEFAULT,    // White - no face detected
        DETECTED,   // Yellow - face detected but not stable
        READY,      // Green - stable, ready to capture
        WARNING     // Red - face too far or not centered
    }

    private var progress: Int = 0  // 0-5 (completed steps)
    private var totalSteps: Int = 5
    private var isRegistrationMode: Boolean = false
    private var cornerState: CornerState = CornerState.DEFAULT

    // Checkmark animation
    private var showCheckmark: Boolean = false
    private var checkmarkProgress: Float = 0f
    private var checkmarkAnimator: ValueAnimator? = null

    // Paint for completed segments (green)
    private val completedPaint = Paint().apply {
        color = 0xFF4CAF50.toInt()  // Green
        style = Paint.Style.STROKE
        strokeWidth = 8f
        isAntiAlias = true
        strokeCap = Paint.Cap.ROUND
    }

    // Paint for pending segments (white semi-transparent)
    private val pendingPaint = Paint().apply {
        color = 0x80FFFFFF.toInt()  // White 50%
        style = Paint.Style.STROKE
        strokeWidth = 4f
        isAntiAlias = true
        strokeCap = Paint.Cap.ROUND
    }

    // Paint for face frame border (white)
    private val framePaint = Paint().apply {
        color = 0xFFFFFFFF.toInt()  // White
        style = Paint.Style.STROKE
        strokeWidth = 3f
        isAntiAlias = true
    }

    // Corner marks paint - THICK for visibility
    private val cornerPaint = Paint().apply {
        color = 0xFFFFFFFF.toInt()  // White
        style = Paint.Style.STROKE
        strokeWidth = 16f  // Very thick for visibility
        isAntiAlias = true
        strokeCap = Paint.Cap.ROUND
    }

    // Checkmark paint
    private val checkmarkPaint = Paint().apply {
        color = 0xFF4CAF50.toInt()  // Green
        style = Paint.Style.STROKE
        strokeWidth = 12f
        isAntiAlias = true
        strokeCap = Paint.Cap.ROUND
        strokeJoin = Paint.Join.ROUND
    }

    // Checkmark background circle
    private val checkmarkBgPaint = Paint().apply {
        color = 0xCC000000.toInt()  // Semi-transparent black
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    private val ovalRect = RectF()
    private val progressRect = RectF()
    private val checkmarkPath = Path()

    // Gap between segments in degrees
    private val segmentGap = 8f

    // Corner mark length - LONGER for visibility
    private val cornerLength = 70f

    fun setProgress(completedSteps: Int) {
        if (this.progress != completedSteps) {
            this.progress = completedSteps.coerceIn(0, totalSteps)
            invalidate()
        }
    }

    fun setRegistrationMode(enabled: Boolean) {
        if (this.isRegistrationMode != enabled) {
            this.isRegistrationMode = enabled
            invalidate()
        }
    }

    fun setCornerState(state: CornerState) {
        if (this.cornerState != state) {
            this.cornerState = state
            invalidate()
        }
    }

    /**
     * Show animated checkmark when a pose is captured successfully
     */
    fun showCheckmarkAnimation() {
        showCheckmark = true
        checkmarkProgress = 0f

        checkmarkAnimator?.cancel()
        checkmarkAnimator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = 400  // 400ms animation
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { animation ->
                checkmarkProgress = animation.animatedValue as Float
                invalidate()
            }
        }
        checkmarkAnimator?.start()

        // Auto-hide checkmark after animation + display time
        postDelayed({
            hideCheckmark()
        }, 800)  // Show for 800ms total
    }

    private fun hideCheckmark() {
        showCheckmark = false
        checkmarkProgress = 0f
        invalidate()
    }

    private fun getCornerColor(): Int = when (cornerState) {
        CornerState.DEFAULT -> 0xFFFFFFFF.toInt()   // White
        CornerState.DETECTED -> 0xFFFFEB3B.toInt()  // Yellow
        CornerState.READY -> 0xFF4CAF50.toInt()     // Green
        CornerState.WARNING -> 0xFFF44336.toInt()   // Red
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        val centerX = width / 2f
        val centerY = height / 2f
        val ovalWidth = width * 0.85f
        val ovalHeight = height * 0.90f

        // Set oval bounds
        ovalRect.set(
            centerX - ovalWidth / 2,
            centerY - ovalHeight / 2,
            centerX + ovalWidth / 2,
            centerY + ovalHeight / 2
        )

        // Draw corner marks (always visible)
        drawCornerMarks(canvas)

        // Draw face frame oval (thin white border)
        canvas.drawOval(ovalRect, framePaint)

        // Draw progress segments only in registration mode
        if (isRegistrationMode && totalSteps > 0) {
            drawProgressSegments(canvas)
        }

        // Draw checkmark animation if active
        if (showCheckmark && checkmarkProgress > 0f) {
            drawCheckmark(canvas, centerX, centerY)
        }
    }

    private fun drawCornerMarks(canvas: Canvas) {
        val left = ovalRect.left
        val top = ovalRect.top
        val right = ovalRect.right
        val bottom = ovalRect.bottom

        // Update corner paint color based on state
        cornerPaint.color = getCornerColor()

        // Top-left corner
        canvas.drawLine(left, top + cornerLength, left, top, cornerPaint)
        canvas.drawLine(left, top, left + cornerLength, top, cornerPaint)

        // Top-right corner
        canvas.drawLine(right - cornerLength, top, right, top, cornerPaint)
        canvas.drawLine(right, top, right, top + cornerLength, cornerPaint)

        // Bottom-left corner
        canvas.drawLine(left, bottom - cornerLength, left, bottom, cornerPaint)
        canvas.drawLine(left, bottom, left + cornerLength, bottom, cornerPaint)

        // Bottom-right corner
        canvas.drawLine(right - cornerLength, bottom, right, bottom, cornerPaint)
        canvas.drawLine(right, bottom, right, bottom - cornerLength, cornerPaint)
    }

    private fun drawProgressSegments(canvas: Canvas) {
        // Progress arc is drawn slightly outside the oval
        val padding = 12f
        progressRect.set(
            ovalRect.left - padding,
            ovalRect.top - padding,
            ovalRect.right + padding,
            ovalRect.bottom + padding
        )

        // Calculate segment size
        val totalDegrees = 360f
        val totalGaps = totalSteps * segmentGap
        val availableDegrees = totalDegrees - totalGaps
        val segmentSize = availableDegrees / totalSteps

        // Start from top (-90 degrees)
        var startAngle = -90f

        for (i in 0 until totalSteps) {
            val paint = if (i < progress) completedPaint else pendingPaint

            // Draw segment
            canvas.drawArc(progressRect, startAngle, segmentSize, false, paint)

            // Move to next segment (add segment size + gap)
            startAngle += segmentSize + segmentGap
        }
    }

    private fun drawCheckmark(canvas: Canvas, centerX: Float, centerY: Float) {
        val checkSize = 80f
        val circleRadius = checkSize + 20f

        // Draw background circle with scale animation
        val scale = checkmarkProgress
        canvas.save()
        canvas.scale(scale, scale, centerX, centerY)
        canvas.drawCircle(centerX, centerY, circleRadius, checkmarkBgPaint)
        canvas.restore()

        // Draw checkmark with draw animation
        if (checkmarkProgress > 0.3f) {
            val drawProgress = ((checkmarkProgress - 0.3f) / 0.7f).coerceIn(0f, 1f)

            checkmarkPath.reset()
            val startX = centerX - checkSize * 0.4f
            val startY = centerY
            val midX = centerX - checkSize * 0.1f
            val midY = centerY + checkSize * 0.3f
            val endX = centerX + checkSize * 0.5f
            val endY = centerY - checkSize * 0.3f

            checkmarkPath.moveTo(startX, startY)

            if (drawProgress <= 0.5f) {
                // First part of checkmark
                val p = drawProgress * 2
                checkmarkPath.lineTo(
                    startX + (midX - startX) * p,
                    startY + (midY - startY) * p
                )
            } else {
                // Full first part + second part
                checkmarkPath.lineTo(midX, midY)
                val p = (drawProgress - 0.5f) * 2
                checkmarkPath.lineTo(
                    midX + (endX - midX) * p,
                    midY + (endY - midY) * p
                )
            }

            canvas.drawPath(checkmarkPath, checkmarkPaint)
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        checkmarkAnimator?.cancel()
    }
}
