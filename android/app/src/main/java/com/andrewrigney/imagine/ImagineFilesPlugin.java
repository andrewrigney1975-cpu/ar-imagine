package com.andrewrigney.imagine;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.graphics.Rect;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.DisplayMetrics;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Saves files the page would otherwise download. A WebView can't follow
 * <a download> links, so imagine.html sends the file here as base64 instead.
 * Images go to Pictures/Imagine (so they show up in the gallery), anything
 * else (preset exports) to Download/Imagine.
 *
 * Also reports the screen's exact size in pixels, which the page can only
 * estimate (screen.width is in whole CSS pixels).
 */
@CapacitorPlugin(name = "ImagineFiles")
public class ImagineFilesPlugin extends Plugin {

    @PluginMethod
    public void save(PluginCall call) {
        String filename = call.getString("filename");
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String data = call.getString("data");
        if (filename == null || data == null) {
            call.reject("filename and data are required");
            return;
        }

        boolean image = mimeType.startsWith("image/");
        String folder = (image ? Environment.DIRECTORY_PICTURES : Environment.DIRECTORY_DOWNLOADS) + "/Imagine";

        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                saveToMediaStore(filename, mimeType, folder, image, bytes);
            } else {
                // Before Android 10, writing to shared storage needs a permission;
                // the app's own external folder doesn't.
                File dir = new File(getContext().getExternalFilesDir(null), folder);
                if (!dir.exists() && !dir.mkdirs()) throw new Exception("Couldn't create " + dir);
                try (OutputStream out = new FileOutputStream(new File(dir, filename))) {
                    out.write(bytes);
                }
            }
            JSObject result = new JSObject();
            result.put("folder", folder);
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Couldn't save " + filename + ": " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void screenSize(PluginCall call) {
        int width, height;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Rect bounds = getActivity().getWindowManager().getMaximumWindowMetrics().getBounds();
            width = bounds.width();
            height = bounds.height();
        } else {
            DisplayMetrics metrics = new DisplayMetrics();
            getActivity().getWindowManager().getDefaultDisplay().getRealMetrics(metrics);
            width = metrics.widthPixels;
            height = metrics.heightPixels;
        }
        JSObject result = new JSObject();
        result.put("width", width);
        result.put("height", height);
        call.resolve(result);
    }

    private void saveToMediaStore(String filename, String mimeType, String folder, boolean image, byte[] bytes)
            throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        Uri collection = image
                ? MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
                : MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY);

        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, folder);
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        Uri uri = resolver.insert(collection, values);
        if (uri == null) throw new Exception("MediaStore insert failed");
        try (OutputStream out = resolver.openOutputStream(uri)) {
            if (out == null) throw new Exception("Couldn't open output stream");
            out.write(bytes);
        } catch (Exception e) {
            resolver.delete(uri, null, null);
            throw e;
        }

        values.clear();
        values.put(MediaStore.MediaColumns.IS_PENDING, 0);
        resolver.update(uri, values, null, null);
    }
}
