import { paymentController } from '../../../_controllers/paymentController';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return paymentController.getSubscriptionPlans(id);
}
