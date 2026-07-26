package com.steamixtv.player

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.FrameLayout
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.trackselection.DefaultTrackSelector
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView

@UnstableApi
class MainActivity : ComponentActivity() {

    private var player: ExoPlayer? = null
    private lateinit var playerView: PlayerView
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val layout = FrameLayout(this).apply {
            setBackgroundColor(android.graphics.Color.BLACK)
        }

        playerView = PlayerView(this).apply {
            resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
            useController = true
            controllerAutoShow = true
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        layout.addView(playerView)

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleLarge).apply {
            isIndeterminate = true
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
            ).also { it.gravity = android.view.Gravity.CENTER }
        }
        layout.addView(progressBar)

        setContentView(layout)

        val videoUrl = extractVideoUrl(intent)
        if (videoUrl != null) {
            initializePlayer(videoUrl)
        } else {
            Toast.makeText(this, "Video URL bulunamad\u0131", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    private fun extractVideoUrl(intent: Intent?): String? {
        if (intent == null) return null
        val uri = intent.data ?: return null

        // steamixtv://play?url=ENCODED_URL
        if (uri.scheme == "steamixtv" && uri.host == "play") {
            return uri.getQueryParameter("url")
        }

        // Direct HTTP/HTTPS URL
        return uri.toString()
    }

    private fun initializePlayer(url: String) {
        val renderersFactory = DefaultRenderersFactory(this).apply {
            setExtensionRendererMode(DefaultRenderersFactory.EXTENSION_RENDERER_MODE_PREFER)
        }

        val trackSelector = DefaultTrackSelector(this)
        val mediaSourceFactory = DefaultMediaSourceFactory(this)

        player = ExoPlayer.Builder(this, renderersFactory)
            .setTrackSelector(trackSelector)
            .setMediaSourceFactory(mediaSourceFactory)
            .build()
            .also { exo ->
                playerView.player = exo

                val mediaItem = MediaItem.Builder()
                    .setUri(Uri.parse(url))
                    .build()

                exo.setMediaItem(mediaItem)
                exo.prepare()
                exo.playWhenReady = true

                exo.addListener(object : Player.Listener {
                    override fun onPlaybackStateChanged(state: Int) {
                        progressBar.visibility = when (state) {
                            Player.STATE_BUFFERING -> View.VISIBLE
                            else -> View.GONE
                        }
                    }

                    override fun onIsPlayingChanged(isPlaying: Boolean) {
                        if (isPlaying) progressBar.visibility = View.GONE
                    }

                    override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
                        Toast.makeText(this@MainActivity,
                            "Hata: ${error.localizedMessage ?: error.message}",
                            Toast.LENGTH_LONG).show()
                        progressBar.visibility = View.GONE
                    }
                })
            }
    }

    override fun onStart() {
        super.onStart()
        player?.play()
    }

    override fun onStop() {
        super.onStop()
        player?.pause()
    }

    override fun onDestroy() {
        super.onDestroy()
        player?.release()
        player = null
    }
}
