Add-Type -AssemblyName System.Drawing

$sizes = @{
  "mipmap-mdpi" = 48
  "mipmap-hdpi" = 72
  "mipmap-xhdpi" = 96
  "mipmap-xxhdpi" = 144
  "mipmap-xxxhdpi" = 192
}

$base = Join-Path $PSScriptRoot "..\android\app\src\main\res"

function New-MaumoraIcon {
  param(
    [string] $Path,
    [int] $Size,
    [bool] $Round
  )

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::FromArgb(7, 3, 11))

  $rect = New-Object System.Drawing.Rectangle 0, 0, $Size, $Size
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(30, 4, 28)), ([System.Drawing.Color]::FromArgb(5, 2, 8)), 45

  if ($Round) {
    $clip = New-Object System.Drawing.Drawing2D.GraphicsPath
    $clip.AddEllipse(0, 0, $Size, $Size)
    $graphics.SetClip($clip)
  }

  $graphics.FillRectangle($bg, $rect)

  $pad = [Math]::Max(4, [int]($Size * 0.08))
  $inner = New-Object System.Drawing.Rectangle $pad, $pad, ($Size - (2 * $pad)), ($Size - (2 * $pad))
  $borderWidth = [Math]::Max(3, [int]($Size * 0.055))
  $border = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(229, 9, 20)), $borderWidth

  if ($Round) {
    $graphics.DrawEllipse($border, $inner)
  } else {
    $corner = [Math]::Max(10, [int]($Size * 0.18))
    $shapePath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $corner * 2
    $shapePath.AddArc($inner.X, $inner.Y, $diameter, $diameter, 180, 90)
    $shapePath.AddArc(($inner.Right - $diameter), $inner.Y, $diameter, $diameter, 270, 90)
    $shapePath.AddArc(($inner.Right - $diameter), ($inner.Bottom - $diameter), $diameter, $diameter, 0, 90)
    $shapePath.AddArc($inner.X, ($inner.Bottom - $diameter), $diameter, $diameter, 90, 90)
    $shapePath.CloseFigure()
    $graphics.DrawPath($border, $shapePath)
  }

  $fontSize = [Math]::Max(24, [int]($Size * 0.58))
  $font = New-Object System.Drawing.Font "Arial Black", $fontSize, ([System.Drawing.FontStyle]::Bold), ([System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  $shadow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(140, 0, 0, 0))
  $shadowRect = New-Object System.Drawing.RectangleF 2, 3, $Size, $Size
  $graphics.DrawString("M", $font, $shadow, $shadowRect, $format)

  $text = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(247, 241, 232))
  $textRect = New-Object System.Drawing.RectangleF 0, 0, $Size, $Size
  $graphics.DrawString("M", $font, $text, $textRect, $format)

  $cx = [float]($Size * 0.58)
  $cy = [float]($Size * 0.55)
  $radius = [float]($Size * 0.18)
  $circle = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(222, 123, 47, 190))
  $graphics.FillEllipse($circle, ($cx - $radius), ($cy - $radius), ($radius * 2), ($radius * 2))

  $play = New-Object System.Drawing.Drawing2D.GraphicsPath
  $play.AddPolygon(@(
    (New-Object System.Drawing.PointF ([float]($cx - ($radius * 0.26)), [float]($cy - ($radius * 0.5)))),
    (New-Object System.Drawing.PointF ([float]($cx - ($radius * 0.26)), [float]($cy + ($radius * 0.5)))),
    (New-Object System.Drawing.PointF ([float]($cx + ($radius * 0.58)), [float]$cy))
  ))
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $graphics.FillPath($white, $play)

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

foreach ($entry in $sizes.GetEnumerator()) {
  $dir = Join-Path $base $entry.Key
  New-MaumoraIcon -Path (Join-Path $dir "ic_launcher.png") -Size $entry.Value -Round $false
  New-MaumoraIcon -Path (Join-Path $dir "ic_launcher_round.png") -Size $entry.Value -Round $true
  New-MaumoraIcon -Path (Join-Path $dir "ic_launcher_foreground.png") -Size ([int]($entry.Value * 2.25)) -Round $false
}
