// Remove fundo conectado às bordas (flood fill). PNGs com fundo preto vira alpha 0.
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Globalization;

internal static class Program
{
    private static void Main(string[] args)
    {
        if (args.Length < 2)
        {
            Console.Error.WriteLine("Usage: LogoBgStripper.exe <input.png> <output.png> [tolerance]");
            Environment.Exit(1);
            return;
        }

        string inPath = args[0];
        string outPath = args[1];
        int tol = args.Length > 2 ? int.Parse(args[2], CultureInfo.InvariantCulture) : 55;

        using (Bitmap loaded = new Bitmap(inPath))
        {
            Bitmap work;
            if (loaded.PixelFormat != PixelFormat.Format32bppArgb)
            {
                work = loaded.Clone(new Rectangle(0, 0, loaded.Width, loaded.Height), PixelFormat.Format32bppArgb);
                loaded.Dispose();
            }
            else
            {
                work = loaded;
            }

            using (work)
            {
                int w = work.Width;
                int h = work.Height;

                int edgeTrans = 0;
                int edgeTotal = 0;
                for (int x = 0; x < w; x++)
                {
                    SampleEdge(work, x, 0, ref edgeTrans, ref edgeTotal);
                    SampleEdge(work, x, h - 1, ref edgeTrans, ref edgeTotal);
                }

                for (int y = 0; y < h; y++)
                {
                    SampleEdge(work, 0, y, ref edgeTrans, ref edgeTotal);
                    SampleEdge(work, w - 1, y, ref edgeTrans, ref edgeTotal);
                }

                if (edgeTotal > 0 && (double)edgeTrans / edgeTotal > 0.32)
                {
                    work.Save(outPath, ImageFormat.Png);
                    Console.WriteLine("skip (bordas já transparentes): " + inPath);
                    return;
                }

                FloodRemoveEdgeBackground(work, w, h, tol);
                work.Save(outPath, ImageFormat.Png);
                Console.WriteLine("ok: " + outPath);
            }
        }
    }

    private static void SampleEdge(Bitmap bmp, int x, int y, ref int edgeTrans, ref int edgeTotal)
    {
        Color c = bmp.GetPixel(x, y);
        edgeTotal++;
        if (c.A < 140)
        {
            edgeTrans++;
        }
    }

    private static unsafe void FloodRemoveEdgeBackground(Bitmap work, int w, int h, int tol)
    {
        int tolSq = tol * tol;
        BitmapData bd = work.LockBits(
            new Rectangle(0, 0, w, h),
            ImageLockMode.ReadWrite,
            PixelFormat.Format32bppArgb);
        try
        {
            byte* p0 = (byte*)(void*)bd.Scan0;
            int stride = bd.Stride;

            long sbr = 0, sbg = 0, sbb = 0;
            CornerSum(p0, stride, 0, 0, ref sbr, ref sbg, ref sbb);
            CornerSum(p0, stride, w - 1, 0, ref sbr, ref sbg, ref sbb);
            CornerSum(p0, stride, 0, h - 1, ref sbr, ref sbg, ref sbb);
            CornerSum(p0, stride, w - 1, h - 1, ref sbr, ref sbg, ref sbb);
            int br = (int)(sbr / 4);
            int bg = (int)(sbg / 4);
            int bb = (int)(sbb / 4);

            var vis = new bool[w * h];
            var q = new Queue<int>();

            for (int x = 0; x < w; x++)
            {
                TryEnqueue(p0, stride, w, h, vis, q, x, 0, br, bg, bb, tolSq);
                TryEnqueue(p0, stride, w, h, vis, q, x, h - 1, br, bg, bb, tolSq);
            }

            for (int y = 0; y < h; y++)
            {
                TryEnqueue(p0, stride, w, h, vis, q, 0, y, br, bg, bb, tolSq);
                TryEnqueue(p0, stride, w, h, vis, q, w - 1, y, br, bg, bb, tolSq);
            }

            while (q.Count > 0)
            {
                int i = q.Dequeue();
                int y = i / w;
                int x = i - (y * w);
                byte* px = p0 + (y * stride) + (x * 4);
                px[3] = 0;
                TryEnqueue(p0, stride, w, h, vis, q, x - 1, y, br, bg, bb, tolSq);
                TryEnqueue(p0, stride, w, h, vis, q, x + 1, y, br, bg, bb, tolSq);
                TryEnqueue(p0, stride, w, h, vis, q, x, y - 1, br, bg, bb, tolSq);
                TryEnqueue(p0, stride, w, h, vis, q, x, y + 1, br, bg, bb, tolSq);
            }
        }
        finally
        {
            work.UnlockBits(bd);
        }
    }

    private static unsafe void CornerSum(byte* p0, int stride, int x, int y, ref long sbr, ref long sbg, ref long sbb)
    {
        byte* px = p0 + (y * stride) + (x * 4);
        sbb += px[0];
        sbg += px[1];
        sbr += px[2];
    }

    private static unsafe bool MatchBg(byte* px, int br, int bg, int bb, int tolSq)
    {
        int dr = px[2] - br;
        int dg = px[1] - bg;
        int db = px[0] - bb;
        return (dr * dr) + (dg * dg) + (db * db) <= tolSq;
    }

    private static unsafe void TryEnqueue(
        byte* p0,
        int stride,
        int w,
        int h,
        bool[] vis,
        Queue<int> q,
        int x,
        int y,
        int br,
        int bg,
        int bb,
        int tolSq)
    {
        if (x < 0 || x >= w || y < 0 || y >= h)
        {
            return;
        }

        int i = (y * w) + x;
        if (vis[i])
        {
            return;
        }

        byte* px = p0 + (y * stride) + (x * 4);
        if (px[3] < 20)
        {
            return;
        }

        if (!MatchBg(px, br, bg, bb, tolSq))
        {
            return;
        }

        vis[i] = true;
        q.Enqueue(i);
    }
}
