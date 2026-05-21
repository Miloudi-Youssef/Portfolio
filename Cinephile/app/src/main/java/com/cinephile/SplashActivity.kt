package com.cinephile

import android.content.Intent
import android.graphics.ImageDecoder
import android.graphics.drawable.AnimatedImageDrawable
import android.graphics.drawable.Animatable2
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

// Splash screen: plays the animated logo GIF, then navigates to MainActivity
class SplashActivity : AppCompatActivity() {

    // guard prevents double-navigation if both the callback and the timer fire
    private var navigated = false

    // onCreate — splash animation setup with 5-second safety timeout
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        setContentView(R.layout.activity_splash)

        val imageView = findViewById<ImageView>(R.id.iv_splash_logo)

        // splash animation — decode the AGIF and play it once via AnimatedImageDrawable
        try {
            val source = ImageDecoder.createSource(resources, R.drawable.cinephile_logo_animated)
            val drawable = ImageDecoder.decodeDrawable(source) as AnimatedImageDrawable
            drawable.repeatCount = 0  // play exactly once
            imageView.setImageDrawable(drawable)
            // navigate as soon as the animation finishes
            drawable.registerAnimationCallback(object : Animatable2.AnimationCallback() {
                override fun onAnimationEnd(d: Drawable?) {
                    runOnUiThread { goToMain() }
                }
            })
            drawable.start()
        } catch (e: Exception) {
            // GIF decode failed — fall through to the safety timer below
        }

        // Safety net: navigate after 5 seconds even if the animation callback never fires
        lifecycleScope.launch {
            delay(5_000)
            goToMain()
        }
    }

    // navigate to main — idempotent, only fires once regardless of how many callers
    private fun goToMain() {
        if (navigated) return
        navigated = true
        startActivity(Intent(this, MainActivity::class.java))
        finish()
    }
}
