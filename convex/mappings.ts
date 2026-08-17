import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("mappings").order("desc").collect();
  },
});

export const getUnmappedAndSuggestions = query({
  args: {},
  handler: async (ctx) => {
    const [unifiUsers, jisrEmployees, mappings] = await Promise.all([
      ctx.db.query("unifiUsers").collect(),
      ctx.db.query("jisrEmployees").collect(),
      ctx.db.query("mappings").collect(),
    ]);

    const mappedUnifiIds = new Set(mappings.map((m) => m.unifiUserId));
    const mappedJisrIds = new Set(mappings.map((m) => m.jisrEmployeeId));

    const unmappedUnifi = unifiUsers.filter((u) => !mappedUnifiIds.has(u.unifiId));
    const unmappedJisr = jisrEmployees.filter((j) => !mappedJisrIds.has(j.jisrId));

    // Smart Match Suggestions based on exact email, employee badge code, or exact full name
    const suggestions: Array<{
      unifiUserId: string;
      unifiUserName: string;
      unifiUserEmail?: string;
      jisrEmployeeId: string;
      jisrEmployeeName: string;
      jisrEmployeeEmail?: string;
      matchReason: string;
      confidence: "HIGH" | "MEDIUM";
    }> = [];

    for (const u of unmappedUnifi) {
      // 1. Check exact email
      if (u.email) {
        const emailMatch = unmappedJisr.find(
          (j) => j.email && j.email.toLowerCase() === u.email?.toLowerCase()
        );
        if (emailMatch) {
          suggestions.push({
            unifiUserId: u.unifiId,
            unifiUserName: u.name,
            unifiUserEmail: u.email,
            jisrEmployeeId: emailMatch.jisrId,
            jisrEmployeeName: emailMatch.name,
            jisrEmployeeEmail: emailMatch.email,
            matchReason: "Matching Work Email",
            confidence: "HIGH",
          });
          continue;
        }
      }

      // 2. Check employee badge / number
      if (u.employeeNumber) {
        const codeMatch = unmappedJisr.find(
          (j) => j.code && j.code.trim() === u.employeeNumber?.trim()
        );
        if (codeMatch) {
          suggestions.push({
            unifiUserId: u.unifiId,
            unifiUserName: u.name,
            unifiUserEmail: u.email,
            jisrEmployeeId: codeMatch.jisrId,
            jisrEmployeeName: codeMatch.name,
            jisrEmployeeEmail: codeMatch.email,
            matchReason: "Matching Employee Badge/Code",
            confidence: "HIGH",
          });
          continue;
        }
      }

      // 3. Exact Name Match
      const nameMatch = unmappedJisr.find(
        (j) => j.name.trim().toLowerCase() === u.name.trim().toLowerCase()
      );
      if (nameMatch) {
        suggestions.push({
          unifiUserId: u.unifiId,
          unifiUserName: u.name,
          unifiUserEmail: u.email,
          jisrEmployeeId: nameMatch.jisrId,
          jisrEmployeeName: nameMatch.name,
          jisrEmployeeEmail: nameMatch.email,
          matchReason: "Exact Full Name",
          confidence: "MEDIUM",
        });
      }
    }

    return {
      unmappedUnifi,
      unmappedJisr,
      suggestions,
      totalMapped: mappings.length,
      totalUnifi: unifiUsers.length,
      totalJisr: jisrEmployees.length,
    };
  },
});

export const saveMapping = mutation({
  args: {
    unifiUserId: v.string(),
    unifiUserName: v.string(),
    jisrEmployeeId: v.string(),
    jisrEmployeeName: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if mapping exists for this unifiUserId
    const existing = await ctx.db
      .query("mappings")
      .withIndex("by_unifi_user", (q) => q.eq("unifiUserId", args.unifiUserId))
      .first();

    let mappingId;
    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      mappingId = existing._id;
    } else {
      mappingId = await ctx.db.insert("mappings", {
        ...args,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Retroactive backfill: Find unmapped historical events for this UniFi user and schedule processing
    if (args.active) {
      const unmappedEvents = await ctx.db
        .query("events")
        .withIndex("by_user_id", (q) => q.eq("userId", args.unifiUserId))
        .filter((q) => q.eq(q.field("status"), "UNMAPPED"))
        .collect();

      for (const event of unmappedEvents) {
        await ctx.scheduler.runAfter(0, internal.attendance.processEventById, {
          eventId: event._id,
        });
      }
    }

    return mappingId;
  },
});

export const remove = mutation({
  args: {
    id: v.id("mappings"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const toggleActive = mutation({
  args: {
    id: v.id("mappings"),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      active: args.active,
      updatedAt: Date.now(),
    });
  },
});
