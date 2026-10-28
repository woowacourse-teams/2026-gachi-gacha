package com.gachigacha.kakaomap

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RectF
import java.util.concurrent.ConcurrentHashMap
import kotlin.math.roundToInt

internal object CapsuleMarkerBitmapFactory {
  private const val STORE_MARKER_SIZE_DP = 34f
  private const val SELECTED_STORE_MARKER_WIDTH_DP = 44f
  private const val SELECTED_STORE_MARKER_HEIGHT_DP = 56f
  private const val USER_MARKER_SIZE_DP = 20f

  private val storeMarkers = ConcurrentHashMap<Int, Bitmap>()
  private val selectedStoreMarkers = ConcurrentHashMap<Int, Bitmap>()
  private val userMarkers = ConcurrentHashMap<Int, Bitmap>()

  fun storeMarker(context: Context): Bitmap {
    val densityDpi = context.resources.displayMetrics.densityDpi
    return storeMarkers.getOrPut(densityDpi) {
      drawStoreMarker(context.resources.displayMetrics.density)
    }
  }

  fun selectedStoreMarker(context: Context): Bitmap {
    val densityDpi = context.resources.displayMetrics.densityDpi
    return selectedStoreMarkers.getOrPut(densityDpi) {
      drawSelectedStoreMarker(context.resources.displayMetrics.density)
    }
  }

  fun userLocationMarker(context: Context): Bitmap {
    val densityDpi = context.resources.displayMetrics.densityDpi
    return userMarkers.getOrPut(densityDpi) {
      drawUserLocationMarker(context.resources.displayMetrics.density)
    }
  }

  private fun drawStoreMarker(density: Float): Bitmap {
    val size = (STORE_MARKER_SIZE_DP * density).roundToInt()
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val center = size / 2f
    val radius = 14.2f * density
    val markerBounds = RectF(
      center - radius,
      center - radius,
      center + radius,
      center + radius,
    )

    val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.FILL
      color = Color.parseColor("#D85A30")
    }
    canvas.drawCircle(center, center, radius, fillPaint)

    canvas.save()
    canvas.clipPath(Path().apply {
      addCircle(center, center, radius, Path.Direction.CW)
    })
    canvas.rotate(-14f, center, center)

    fillPaint.color = Color.parseColor("#DCE9F2")
    canvas.drawRect(-size.toFloat(), -size.toFloat(), size * 2f, center, fillPaint)

    fillPaint.color = Color.argb(110, 220, 233, 242)
    canvas.drawRect(
      -size.toFloat(),
      center - 1.7f * density,
      size * 2f,
      center + 1.7f * density,
      fillPaint,
    )
    canvas.restore()

    val highlightPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.STROKE
      strokeCap = Paint.Cap.ROUND
      strokeWidth = 2.2f * density
      color = Color.WHITE
      alpha = 225
    }
    val highlightInset = 4.7f * density
    canvas.drawArc(
      RectF(
        markerBounds.left + highlightInset,
        markerBounds.top + highlightInset,
        markerBounds.right - highlightInset,
        markerBounds.bottom - highlightInset,
      ),
      195f,
      78f,
      false,
      highlightPaint,
    )

    val outlinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.STROKE
      strokeWidth = 1.35f * density
      color = Color.parseColor("#111111")
    }
    canvas.drawCircle(center, center, radius, outlinePaint)

    return bitmap
  }

  private fun drawSelectedStoreMarker(density: Float): Bitmap {
    val width = (SELECTED_STORE_MARKER_WIDTH_DP * density).roundToInt()
    val height = (SELECTED_STORE_MARKER_HEIGHT_DP * density).roundToInt()
    val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val artScale = 1.06f * density
    val artWidth = 38.09f * artScale
    val offsetX = (width - artWidth) / 2f - 2.3f * artScale
    val offsetY = 3f * density + 2.44f * artScale
    val circleBounds = RectF(3f, 11f, 37f, 45f)
    val seamRightX = 36.7084f
    val seamRightY = 24.8647f

    val bowlPath = Path().apply {
      moveTo(seamRightX, seamRightY)
      arcTo(circleBounds, -10.63f, 173.26f)
      close()
    }
    val lidPath = Path().apply {
      moveTo(3.7755f, 33.0758f)
      arcTo(circleBounds, 162.63f, 186.74f)
      close()
    }
    val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.FILL
      color = Color.parseColor("#D85A30")
    }
    val outlinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.STROKE
      strokeJoin = Paint.Join.ROUND
      strokeWidth = 1.4f
      color = Color.parseColor("#111111")
    }
    val highlightPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.STROKE
      strokeCap = Paint.Cap.ROUND
      strokeWidth = 2.6f
      color = Color.WHITE
      alpha = 230
    }

    canvas.save()
    canvas.translate(offsetX, offsetY)
    canvas.scale(artScale, artScale)

    canvas.drawPath(bowlPath, fillPaint)
    canvas.drawPath(bowlPath, outlinePaint)

    canvas.save()
    canvas.rotate(45f, seamRightX, seamRightY)
    fillPaint.color = Color.parseColor("#DCE9F2")
    canvas.drawPath(lidPath, fillPaint)
    canvas.drawPath(lidPath, outlinePaint)
    canvas.clipPath(lidPath)
    canvas.drawArc(
      RectF(6.4f, 14.4f, 33.6f, 41.6f),
      210f,
      55f,
      false,
      highlightPaint,
    )
    canvas.restore()
    canvas.restore()

    return bitmap
  }

  private fun drawUserLocationMarker(density: Float): Bitmap {
    val size = (USER_MARKER_SIZE_DP * density).roundToInt()
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    val center = size / 2f

    val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.FILL
      color = Color.WHITE
    }
    canvas.drawCircle(center, center, 8.8f * density, paint)

    paint.color = Color.parseColor("#2D7FF9")
    canvas.drawCircle(center, center, 6.1f * density, paint)

    paint.style = Paint.Style.STROKE
    paint.strokeWidth = 1.2f * density
    paint.color = Color.argb(95, 0, 0, 0)
    canvas.drawCircle(center, center, 8.8f * density, paint)

    return bitmap
  }
}
