# the web page calls these methods by name (window.AndroidVoice), so they must keep their names
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
