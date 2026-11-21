package app.bumpity.game;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // The app's own plugin: the "lock" button in the grown-ups' corner.
        registerPlugin(ScreenLockPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
