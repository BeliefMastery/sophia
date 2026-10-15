import { rewardFor } from "../lib/rewards.mjs";

function Reward({ verdict }) {
  const reward = rewardFor(verdict);
  if (!reward) return null;
  return (
    <div className={`reward is-${reward.level}`}>
      <p className="reward-title">{reward.title}</p>
      <p>{reward.detail}</p>
    </div>
  );
}

export { Reward, rewardFor };
