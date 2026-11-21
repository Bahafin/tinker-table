package app.bumpity.game;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Android's screen pinning, started from the grown-ups' corner: the tablet stays in Bumpity
 * until a grown-up unpins it (with the tablet's own PIN if "Ask for PIN before unpinning" is
 * on). Android shows its own confirmation first. See src/app-lock.ts.
 */
@CapacitorPlugin(name = "ScreenLock")
public class ScreenLockPlugin extends Plugin {

    @PluginMethod
    public void start(PluginCall call) {
        Activity activity = getActivity();
        activity.runOnUiThread(() -> {
            try {
                activity.startLockTask();
                call.resolve();
            } catch (Exception e) {
                call.reject("Screen pinning is not available", e);
            }
        });
    }

    @PluginMethod
    public void isLocked(PluginCall call) {
        ActivityManager am = (ActivityManager) getContext().getSystemService(Context.ACTIVITY_SERVICE);
        JSObject result = new JSObject();
        result.put("locked", am != null && am.getLockTaskModeState() != ActivityManager.LOCK_TASK_MODE_NONE);
        call.resolve(result);
    }
}
