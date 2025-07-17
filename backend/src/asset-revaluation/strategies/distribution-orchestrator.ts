import {
  DistributionHandler,
  DistributionContext,
  DistributionResult,
} from './distribution-chain';

export function runDistributionChain(
  handlers: DistributionHandler[],
  initialAmount: number,
  context: DistributionContext,
): DistributionResult {
  let available = initialAmount;
  let result: DistributionResult = {
    assigned: {},
    remaining: initialAmount,
  };
  for (const handler of handlers) {
    const { remaining, updatedResult } = handler.handle(
      available,
      context,
      result,
    );
    available = remaining;
    result = updatedResult;
  }
  return result;
}
