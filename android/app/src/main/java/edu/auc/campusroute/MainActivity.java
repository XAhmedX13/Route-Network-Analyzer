package edu.auc.campusroute;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Locale;

// The whole app is the web page in assets/web, shown in Android's own WebView.
// No Flutter engine, so the app is small and the map moves at the WebView's full speed.
// The page can talk and listen through window.AndroidVoice (see Voice below), for students
// who cannot see the screen well.
public class MainActivity extends Activity {
    private static final int SPEECH_REQUEST = 7;
    private WebView web;
    private TextToSpeech tts;
    private boolean ttsReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(0xFFE8EDEF);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);           // remembers light or dark mode and the voice setting
        s.setAllowFileAccess(true);             // the page and its pictures are local files
        s.setSupportZoom(false);                // the map does its own pinch zoom
        s.setBuiltInZoomControls(false);
        s.setTextZoom(100);                     // keep the layout as designed even with large system text
        web.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        web.setWebViewClient(new WebViewClient());
        web.addJavascriptInterface(new Voice(), "AndroidVoice");
        setContentView(web);

        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int r = tts.setLanguage(Locale.US);
                ttsReady = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED;
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl("file:///android_asset/web/index.html");
    }

    // What the page can call: AndroidVoice.speak(text, interrupt), AndroidVoice.stop(), AndroidVoice.listen()
    private class Voice {
        @JavascriptInterface
        public void speak(String text, boolean interrupt) {
            if (!ttsReady || text == null) return;
            tts.speak(text, interrupt ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD, null, "campus");
        }

        @JavascriptInterface
        public void stop() {
            if (ttsReady) tts.stop();
        }

        // opens Android's speech recognizer; what was heard comes back in onActivityResult
        @JavascriptInterface
        public void listen() {
            runOnUiThread(() -> {
                Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US");
                i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
                i.putExtra(RecognizerIntent.EXTRA_PROMPT, "Say a room or a place");
                try {
                    startActivityForResult(i, SPEECH_REQUEST);
                } catch (ActivityNotFoundException e) {
                    web.evaluateJavascript("window.onVoiceError && window.onVoiceError('unavailable')", null);
                }
            });
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != SPEECH_REQUEST) return;
        ArrayList<String> heard = data == null ? null : data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
        if (resultCode == RESULT_OK && heard != null && !heard.isEmpty()) {
            JSONArray list = new JSONArray(heard);
            web.evaluateJavascript("window.onVoiceResult && window.onVoiceResult(" + list + ")", null);
        } else {
            web.evaluateJavascript("window.onVoiceError && window.onVoiceError(" + JSONObject.quote("nothing") + ")", null);
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    // Back closes one thing at a time inside the page (walking mode, place card, directions, floor view);
    // only when there is nothing left to close does the app go to the background.
    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("window.appBack ? window.appBack() : false", value -> {
            if (!"true".equals(value)) moveTaskToBack(true);
        });
    }

    @Override
    protected void onPause() {
        web.onPause();
        if (ttsReady) tts.stop();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        web.destroy();
        super.onDestroy();
    }
}
