<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>{{ $report['title'] }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; margin: 24px; color: #191c1d; font-size: 12px; }
        .report-brand { margin-bottom: 18px; color: #003f87; }
        .report-logo-mark { display: inline-block; width: 34px; height: 34px; border: 4px solid #003f87; border-radius: 8px; vertical-align: middle; }
        .report-brand-name { display: inline-block; margin-left: 10px; font-size: 20px; font-weight: bold; letter-spacing: .04em; vertical-align: middle; }
        .report-brand-tagline { margin-top: 4px; margin-left: 54px; font-size: 10px; text-transform: uppercase; letter-spacing: .14em; color: #466270; }
        h1 { margin: 0; font-size: 24px; }
        p { margin: 4px 0; color: #4b5563; }
        .metrics { width: 100%; margin: 24px 0 18px; }
        .metric-box { width: 32%; display: inline-block; vertical-align: top; margin-right: 2%; background: #f3f4f6; border-radius: 14px; padding: 12px; }
        .metric-box:last-child { margin-right: 0; }
        .metric-label { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: #003f87; }
        .metric-value { font-size: 18px; font-weight: bold; margin-top: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        th { background: #edeeef; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; }
    </style>
</head>
<body>
    <div class="report-brand">
        <span class="report-logo-mark"></span>
        <span class="report-brand-name">TB. LOSARI JAYA 2</span>
        <div class="report-brand-tagline">Industrial Atelier POS</div>
    </div>
    <h1>{{ $report['title'] }}</h1>
    <p>{{ $report['subtitle'] }}</p>

    <div class="metrics">
        @foreach ($report['metrics'] as $metric)
            <div class="metric-box">
                <div class="metric-label">{{ $metric['label'] }}</div>
                <div class="metric-value">{{ $metric['value'] }}</div>
            </div>
        @endforeach
    </div>

    <table>
        <thead>
            <tr>
                @foreach ($report['headers'] as $header)
                    <th>{{ $header }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($report['rows'] as $row)
                <tr>
                    @foreach ($row as $column)
                        <td>{{ $column }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($report['headers']) }}">Tidak ada data.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
