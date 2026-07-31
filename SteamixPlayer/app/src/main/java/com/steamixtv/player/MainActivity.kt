package com.steamixtv.player

import android.app.AlertDialog
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.lifecycle.lifecycleScope
import com.streamvault.domain.model.PlaybackCompatibilityKey
import com.streamvault.domain.model.PlaybackCompatibilityRecord
import com.streamvault.domain.model.StreamInfo
import com.streamvault.domain.repository.PlaybackCompatibilityRepository
import com.streamvault.player.AudioCompatibilityMemoryStore
import com.streamvault.player.Media3PlayerEngine
import com.streamvault.player.PlaybackState
import com.streamvault.player.PlayerEngine
import com.streamvault.player.PlayerRenderSurfaceType
import com.streamvault.player.PlayerSubtitleStyle
import com.streamvault.player.PlayerSurfaceResizeMode
import com.streamvault.player.PlaybackSupportSnapshotStore
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import java.util.Locale
import java.util.concurrent.TimeUnit.SECONDS

class MainActivity : ComponentActivity() {

    private var playerEngine: PlayerEngine? = null
    private lateinit var progressBar: ProgressBar
    private var autoOpenedSubtitles = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            setupPlayer()
        } catch (t: Throwable) {
            Toast.makeText(this, "Hata: ${t.message}", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    private fun setupPlayer() {
        val layout = FrameLayout(this).apply {
            setBackgroundColor(android.graphics.Color.BLACK)
        }

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleLarge).apply {
            isIndeterminate = true
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).also { it.gravity = android.view.Gravity.CENTER }
        }
        layout.addView(progressBar)

        setContentView(layout)
        hideSystemBars()

        val request = buildStreamInfo(intent)
        if (request == null) {
            Toast.makeText(this, "Video URL bulunamad\u0131", Toast.LENGTH_LONG).show()
            finish()
            return
        }

        initializePlayer(request, layout)
    }

    private fun buildStreamInfo(intent: Intent?): StreamRequest? {
        if (intent == null) return null
        val uri = intent.data ?: return null
        var url: String? = null
        var title: String? = null
        var subtitleUrl: String? = null
        var subtitleLang: String? = null

        if (uri.scheme == "steamixtv" && uri.host == "play") {
            url = uri.getQueryParameter("url")
            title = uri.getQueryParameter("title")
            subtitleUrl = uri.getQueryParameter("subtitle")
            subtitleLang = uri.getQueryParameter("subtitle_lang")
        } else if (uri.scheme == "http" || uri.scheme == "https" || uri.scheme == "rtsp") {
            url = uri.toString()
        }

        if (url.isNullOrBlank()) return null

        return StreamRequest(
            streamInfo = StreamInfo(
                url = url,
                title = title,
                headers = emptyMap()
            ),
            subtitleUrl = subtitleUrl?.takeIf { it.isNotBlank() },
            subtitleLang = subtitleLang?.takeIf { it.isNotBlank() }
        )
    }

    private fun initializePlayer(request: StreamRequest, layout: FrameLayout) {
        val okHttpClient = OkHttpClient.Builder()
            .connectTimeout(15, SECONDS)
            .readTimeout(30, SECONDS)
            .writeTimeout(30, SECONDS)
            .followRedirects(true)
            .followSslRedirects(true)
            .build()

        val engine = Media3PlayerEngine(
            context = applicationContext,
            okHttpClient = okHttpClient,
            playbackCompatibilityRepository = InMemoryPlaybackCompatibilityRepository(),
            audioCompatibilityMemoryStore = AudioCompatibilityMemoryStore(applicationContext),
            playbackSupportSnapshotStore = PlaybackSupportSnapshotStore(applicationContext)
        )
        engine.setSubtitleStyle(
            PlayerSubtitleStyle(
                textScale = 1f,
                foregroundColorArgb = 0xFFFFFFFF.toInt(),
                backgroundColorArgb = 0x80000000.toInt(),
                edgeType = androidx.media3.ui.CaptionStyleCompat.EDGE_TYPE_OUTLINE,
                bottomPaddingFraction = 0.08f,
                useEmbeddedStyles = true
            )
        )
        playerEngine = engine

        val view = engine.createRenderView(
            context = this,
            resizeMode = PlayerSurfaceResizeMode.FIT,
            surfaceType = PlayerRenderSurfaceType.AUTO
        ) as androidx.media3.ui.PlayerView
        view.useController = true
        view.controllerAutoShow = true
        view.controllerShowTimeoutMs = 3000
        view.controllerHideOnTouch = true
        layout.addView(view, 0)
        engine.bindRenderView(view, PlayerSurfaceResizeMode.FIT)
        addSubtitleButton(layout, engine)

        lifecycleScope.launch {
            engine.playbackState.collect { state ->
                progressBar.visibility = when (state) {
                    PlaybackState.BUFFERING, PlaybackState.IDLE -> View.VISIBLE
                    else -> View.GONE
                }
            }
        }
        lifecycleScope.launch {
            engine.error.collect { error ->
                error?.let {
                    Toast.makeText(this@MainActivity, "Hata: ${it.message}", Toast.LENGTH_LONG).show()
                    progressBar.visibility = View.GONE
                }
            }
        }

        engine.prepare(request.streamInfo)
        request.subtitleUrl?.let { subtitleUrl ->
            request.subtitleLang?.let { subtitleLang ->
                engine.addExternalSubtitle(Uri.parse(subtitleUrl), subtitleLang)
            }
        }
    }

    private fun addSubtitleButton(layout: FrameLayout, engine: Media3PlayerEngine) {
        val density = resources.displayMetrics.density
        val size = (46 * density).toInt()
        val cc = TextView(this).apply {
            text = "CC"
            textSize = 15f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setTextColor(android.graphics.Color.WHITE)
            setBackgroundColor(0x80000000.toInt())
            gravity = android.view.Gravity.CENTER
            isClickable = true
            isFocusable = true
            layoutParams = FrameLayout.LayoutParams(size, size).also {
                it.gravity = android.view.Gravity.TOP or android.view.Gravity.END
                it.topMargin = (24 * density).toInt()
                it.rightMargin = (12 * density).toInt()
            }
            setOnClickListener { showSubtitleDialog(engine) }
        }
        layout.addView(cc)

        lifecycleScope.launch {
            engine.availableSubtitleTracks.collect { tracks ->
                val hasSubtitles = tracks.isNotEmpty()
                cc.visibility = if (hasSubtitles) View.VISIBLE else View.GONE
                cc.alpha = if (tracks.any { it.isSelected }) 1f else 0.6f
                if (hasSubtitles && !autoOpenedSubtitles) {
                    autoOpenedSubtitles = true
                    val deviceLang = Locale.getDefault().language
                    val match = tracks.firstOrNull {
                        it.language?.startsWith(deviceLang, true) == true
                    } ?: tracks.first()
                    engine.selectSubtitleTrack(match.id)
                }
            }
        }
    }

    private fun showSubtitleDialog(engine: Media3PlayerEngine) {
        val tracks = engine.availableSubtitleTracks.value
        val names = mutableListOf("Altyaz\u0131 Kapal\u0131")
        names += tracks.map { it.name }
        val selectedIndex = tracks.indexOfFirst { it.isSelected }.let { if (it >= 0) it + 1 else 0 }
        AlertDialog.Builder(this)
            .setTitle("Altyaz\u0131 (\u00a0${tracks.size} dil)")
            .setSingleChoiceItems(names.toTypedArray(), selectedIndex) { dialog, which ->
                if (which == 0) {
                    engine.selectSubtitleTrack(null)
                } else {
                    engine.selectSubtitleTrack(tracks[which - 1].id)
                }
                dialog.dismiss()
            }
            .setNegativeButton("Kapat", null)
            .show()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    private fun hideSystemBars() {
        val decorView = window.decorView
        if (decorView == null) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
            decorView.windowInsetsController?.let {
                it.hide(WindowInsets.Type.systemBars())
                it.systemBarsBehavior =
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    or View.SYSTEM_UI_FLAG_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                )
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        recreate()
    }

    override fun onStart() {
        super.onStart()
        playerEngine?.play()
    }

    override fun onStop() {
        super.onStop()
        playerEngine?.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        playerEngine?.release()
        playerEngine = null
    }
}

data class StreamRequest(
    val streamInfo: StreamInfo,
    val subtitleUrl: String?,
    val subtitleLang: String?
)

/**
 * Minimal in-memory implementation of the compatibility repository.
 * The player engine behaves exactly like the original when no records exist.
 */
class InMemoryPlaybackCompatibilityRepository : PlaybackCompatibilityRepository {
    override suspend fun getKnownBadRecords(
        deviceFingerprint: String,
        streamType: String,
        videoMimeType: String,
        resolutionBucket: String
    ): List<PlaybackCompatibilityRecord> = emptyList()

    override suspend fun recordFailure(key: PlaybackCompatibilityKey, failureType: String, at: Long) = Unit

    override suspend fun recordSuccess(key: PlaybackCompatibilityKey, at: Long) = Unit

    override suspend fun prune(maxRecords: Int, olderThanMs: Long) = Unit
}
