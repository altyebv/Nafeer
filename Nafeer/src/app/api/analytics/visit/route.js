import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
import { SiteSettings } from '@/lib/models/SiteSettings';

// ─── POST /api/analytics/visit ────────────────────────────────────────────────
// Fire-and-forget visit counter. Increments total AND today's daily bucket.
// Prunes buckets older than 90 days to stay lean.

export async function POST() {
  try {
    await connectDB();

    const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    // Atomically increment total + upsert today's bucket + prune old buckets
    await SiteSettings.findOneAndUpdate(
      { key: 'global' },
      [
        {
          $set: {
            visitCount: { $add: [{ $ifNull: ['$visitCount', 0] }, 1] },

            // Upsert today's bucket in the array
            visitsByDay: {
              $let: {
                vars: {
                  // First filter out old buckets
                  recent: {
                    $filter: {
                      input: { $ifNull: ['$visitsByDay', []] },
                      cond:  { $gte: ['$$this.date', cutoffStr] },
                    },
                  },
                },
                in: {
                  $let: {
                    vars: {
                      hasToday: {
                        $gt: [
                          { $size: { $filter: { input: '$$recent', cond: { $eq: ['$$this.date', today] } } } },
                          0,
                        ],
                      },
                    },
                    in: {
                      $cond: {
                        if: '$$hasToday',
                        // Increment existing today bucket
                        then: {
                          $map: {
                            input: '$$recent',
                            as: 'b',
                            in: {
                              $cond: {
                                if:   { $eq: ['$$b.date', today] },
                                then: { date: '$$b.date', count: { $add: ['$$b.count', 1] } },
                                else: '$$b',
                              },
                            },
                          },
                        },
                        // Append new today bucket
                        else: { $concatArrays: ['$$recent', [{ date: today, count: 1 }]] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ],
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch {
    // Silent fail — never break the page for analytics
    return NextResponse.json({ ok: false });
  }
}