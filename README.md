# StromBench

This repository packs raw data and instrumentation code, used for measuring macOS electricity usage, specifically during browser usage.

More detailed breakdowns are in this blogpost: https://medium.com/homullus/8-browsers-in-a-tiny-car-energy-efficiency-benchmark-fe3ca82f1690

## Test Route

1. Open this Notion Page.
2. Google “speedtest” and run it.
3. Google “Speedometer” and run it.
4. Watch whole 2k HDR 60fps on YouTube (paste url) in full screen mode. https://www.youtube.com/watch?v=Jrh5idPduJA
5. Watch Dave2d in HD (paste url) in PiP, while doing all stuff below. https://www.youtube.com/watch?v=drLZxyv79Oo
6. Search for "drazevac shelter" on Google via address bar. Open the page and slowly scroll to bottom as if you were reading it.
7. Open a local apartment searching website and find a specific apartment every time. Go through the slideshow, read the page, copy the address.
8. Paste the address into google, and click on the Google Maps widget/result. Zoom in and out. Use 3D, use StreetView.
9. Open pinterest search for "scandi coffee table"
10. Google for wolt, find a sushi place, look at 5 items.
11. Open elgiganten. Go to TVs, and open the same TV each time.
12. Open a Danish News website, click on an article, copy URL.
Open Google Translate, paste the URL and click on the result. This will open a new, translated
page. Spend time slowly reading the article.

## Code for test

- `ioreg` Method - Not using because its cached every ~30sec. Also doesn’t give raw mW values.
    
    Got it from here: **https://superuser.com/questions/1700177/how-can-i-calculate-how-much-energy-in-watt-hours-my-mac-laptop-uses-over-a-gi**
    
    - Only usable ON AC + 100% battery, otherwise results skewed.
        
        ```bash
        ioreg -rw0 -c AppleSmartBattery | grep BatteryData | grep -o '"AdapterPower"=[0-9]*' | cut -c 16- | xargs -I %  lldb --batch -o "    print/f %" | grep -o '$0 = [0-9.]*' | cut -c 6-
        ```
        
    - This one is for use ON BATTERY, as it gets the battery capacity. We can also use `CurrentCapacity` which gets %
        
        ```bash
        ioreg -rw0 -c AppleSmartBattery | grep AppleRawCurrentCapacity | grep -o '"AppleRawCurrentCapacity" = [0-9]*'  | cut -c 29-
        ```
        
    
    To compute the number of watt-hours, what I ended up doing was the following:
    
    1. Storing the number of watts consumed in a log file once every 60 seconds (via a simple cron script)
    2. Dividing each of these watt measurements by 60 (since we're sampling once per minute)
    3. Summing all of these measurements up (60 measurements = 1 hour) to compute the total number of watt-hours being used in as close to real-time as possible.

I'm using `powermetrics` that is the closest we can get to realtime power usage readings. It is used by another popular tool **[tlkh/asitop](https://github.com/tlkh/asitop)**, as well as a deep dive **[singkays/apple-m1-power-consumption-powermetrics](https://github.com/singhkays/apple-m1-power-consumption-powermetrics)**.

**https://singhkays.com/blog/apple-silicon-m1-video-power-consumption-pt-1/**

```bash
sudo powermetrics \
  -i 1000 \
  --samplers cpu_power,gpu_power \
  -a --hide-cpu-duty-cycle \
  --show-usage-summary \
  --show-extra-power-info \
| grep --line-buffered -E "Combined Power \(CPU \+ GPU \+ ANE\): [0-9]*" \
| sed -u -n 's/Combined Power (CPU + GPU + ANE): \([0-9]*\) mW/\1/p' \
| while read -r line; do printf "%s, %s\n" $(date +%s) $line; done \
> ~/Desktop/output.txt
```

**Ouput:**

```
1681226924, 28
1681226925, 48
1681226926, 38
1681226927, 103
1681226928, 68
1681226929, 85
1681226930, 238
1681226931, 284
1681226932, 176
1681226933, 190
1681226934, 257
1681226935, 337
1681226937, 41
```

Here is an idea for a cool comparative chart later on

[Horizontal Stacked Bar Chart](https://vega.github.io/vega-lite/examples/stacked_bar_h.html)
