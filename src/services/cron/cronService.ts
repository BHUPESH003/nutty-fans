import { CreatorRepository } from '@/repositories/creatorRepository';
import { PostRepository } from '@/repositories/postRepository';
import { SubscriptionRepository } from '@/repositories/subscriptionRepository';
import { TeaserPreviewService } from '@/services/content/previewGeneration/teaserPreviewService';
import { PayoutService } from '@/services/payments/payoutService';
import { SubscriptionService } from '@/services/payments/subscriptionService';

export class CronService {
  constructor(
    private readonly subscriptionRepo = new SubscriptionRepository(),
    private readonly postRepo = new PostRepository(),
    private readonly creatorRepo = new CreatorRepository(),
    private readonly subscriptionService = new SubscriptionService(),
    private readonly payoutService = new PayoutService(),
    private readonly teaserPreviewService = new TeaserPreviewService()
  ) {}

  async runDailyTasks(now: Date = new Date()) {
    const results = {
      subscriptionRenewals: {
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [] as string[],
      },
      scheduledPosts: {
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [] as string[],
      },
      teaserPreviews: {
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [] as string[],
      },
    };

    // 1) Subscription renewals
    try {
      const renewalWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const expiring = await this.subscriptionRepo.findExpiringAutoRenewWithin(
        now,
        renewalWindow,
        100
      );

      const eligible = expiring.filter((sub) => {
        const metadata = (sub.metadata ?? {}) as Record<string, unknown>;
        return !metadata['gracePeriodStart'];
      });

      for (const sub of eligible) {
        try {
          const res = await this.subscriptionService.processRenewal(sub.id);
          results.subscriptionRenewals.processed++;
          if (res.success) results.subscriptionRenewals.succeeded++;
          else {
            results.subscriptionRenewals.failed++;
            if (res.error)
              results.subscriptionRenewals.errors.push(`Subscription ${sub.id}: ${res.error}`);
          }
        } catch (err) {
          results.subscriptionRenewals.failed++;
          results.subscriptionRenewals.errors.push(
            `Subscription ${sub.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }
    } catch (err) {
      results.subscriptionRenewals.errors.push(
        `Subscription renewal processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    // 2) Publish scheduled posts
    try {
      const scheduled = await this.postRepo.findScheduledToPublish(now, 50);
      for (const post of scheduled) {
        try {
          await this.postRepo.publishScheduled(post.id, post.scheduledAt ?? now);
          results.scheduledPosts.processed++;
          results.scheduledPosts.succeeded++;
        } catch (err) {
          results.scheduledPosts.processed++;
          results.scheduledPosts.failed++;
          results.scheduledPosts.errors.push(
            `Post ${post.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
          );
        }
      }
    } catch (err) {
      results.scheduledPosts.errors.push(
        `Scheduled post processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    // 3) Generate teaser previews for locked teaser configs (ffmpeg -> S3 -> update Media.previewUrl)
    try {
      const teaserRes = await this.teaserPreviewService.generateTeaserPreviews({ limit: 15 });
      results.teaserPreviews = {
        processed: teaserRes.processed,
        succeeded: teaserRes.succeeded,
        failed: teaserRes.failed,
        errors: teaserRes.errors,
      };
    } catch (err) {
      results.teaserPreviews.failed += 1;
      results.teaserPreviews.errors.push(
        err instanceof Error ? err.message : 'Unknown teaser preview job error'
      );
    }

    return results;
  }

  async runWeeklyPayouts() {
    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      payoutsCreated: [] as Array<{ creatorId: string; payoutId: string; amount: number }>,
      errors: [] as string[],
    };

    const activeCreators = await this.creatorRepo.findActiveCreatorsForPayouts();
    for (const creator of activeCreators) {
      try {
        const payout = await this.payoutService.createPayout(creator.id);
        results.processed++;
        if (payout) {
          results.succeeded++;
          results.payoutsCreated.push({
            creatorId: creator.id,
            payoutId: payout.id,
            amount: payout.amount,
          });
        }
      } catch (err) {
        results.failed++;
        results.errors.push(
          `Creator ${creator.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    return results;
  }
}
