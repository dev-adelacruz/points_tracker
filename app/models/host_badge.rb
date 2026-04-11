# frozen_string_literal: true

class HostBadge < ApplicationRecord
  BADGES = {
    "first_quota"      => { label: "First Quota",       emoji: "🏆", description: "Hit your monthly coin quota for the first time." },
    "three_month_streak" => { label: "3-Month Streak",  emoji: "🔥", description: "Hit your monthly quota 3 months in a row." },
    "top_performer"    => { label: "Top Performer",      emoji: "⭐", description: "Ranked #1 on the leaderboard for a full month." },
    "century_coins"    => { label: "Century Coins",      emoji: "💰", description: "Earned 100,000+ coins in a single month." },
    "veteran_host"     => { label: "Veteran Host",       emoji: "🎖️", description: "Attended 50+ sessions total." }
  }.freeze

  belongs_to :user

  validates :badge_key, inclusion: { in: BADGES.keys }
  validates :badge_key, uniqueness: { scope: :user_id }
  validates :earned_on, presence: true
end
