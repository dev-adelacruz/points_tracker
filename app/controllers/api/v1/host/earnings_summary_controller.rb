# frozen_string_literal: true

class Api::V1::Host::EarningsSummaryController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_role!

  def show
    base = CoinEntry.joins(:session).where(user_id: current_user.id)
    today = Date.current
    month_start = today.beginning_of_month
    days_remaining = (today.end_of_month - today).to_i + 1

    this_month = base.where("sessions.date >= ?", month_start).sum(:coins)
    quota = current_user.monthly_coin_quota
    coins_remaining = [ quota - this_month, 0 ].max
    quota_progress = quota > 0 ? (this_month.to_f / quota * 100).round(1) : 0.0

    render json: {
      status: { code: 200, message: "Earnings summary retrieved successfully." },
      data: {
        today: base.where("sessions.date = ?", today).sum(:coins),
        this_week: base.where("sessions.date >= ?", today.beginning_of_week).sum(:coins),
        this_month: this_month,
        all_time: base.sum(:coins),
        monthly_coin_quota: quota,
        coins_remaining: coins_remaining,
        quota_progress: quota_progress,
        days_remaining_in_month: days_remaining
      }
    }, status: :ok
  end

  private

  def authorize_role!
    super(:host)
  end
end
