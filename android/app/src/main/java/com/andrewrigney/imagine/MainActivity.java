package com.andrewrigney.imagine;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ImagineFilesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
