import mongoose from 'mongoose';

// ─── Announcement ─────────────────────────────────────────────────────────────
// Admin-authored messages shown on the contributor dashboard.
// Pinned announcements always float to the top.
// targetSubjects: empty array means broadcast to all contributors.

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 120,
    },

    body: {
      type:     String,
      required: true,
      trim:     true,
      maxlength: 2000,
    },

    // Visual weight / icon treatment on the dashboard
    type: {
      type:    String,
      enum:    ['info', 'update', 'warning', 'milestone'],
      default: 'info',
    },

    pinned: { type: Boolean, default: false },

    // Denormalized — no populate needed
    authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    authorName: { type: String, default: 'الإدارة', trim: true },

    // Empty = show to all; populated = show only to these subject contributors
    targetSubjects: { type: [String], default: [] },

    // Narrower audiences (see /api/contributors/announcement). They were sent
    // by the admin UI but missing here, so strict mode dropped them and a
    // message meant for one person went to everyone.
    targetTeamIds:        { type: [mongoose.Schema.Types.ObjectId], default: [] },
    targetContributorIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    // Set when a team lead wrote it (docs/team-leads.md L2): the Contributor
    // _id. A lead may remove only announcements they wrote, for their subject.
    leadAuthorId: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

// Pinned first, then newest
AnnouncementSchema.index({ pinned: -1, createdAt: -1 });

export const Announcement =
  mongoose.models.Announcement ||
  mongoose.model('Announcement', AnnouncementSchema);