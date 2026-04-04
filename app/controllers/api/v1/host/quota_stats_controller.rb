# frozen_string_literal: true

class Api::V1::Host::QuotaStatsController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_host!

  def show
    days_elapsed  = Date.current.day
    days_in_month = Date.current.end_of_month.day

    session_ids = Session
      .where(team_id: current_user.teams.pluck(:id))
      .where(date: Date.current.beginning_of_month..Date.current)
      .pluck(:id)

    total_coins    = CoinEntry.where(user_id: current_user.id, session_id: session_ids).sum(:coins)
    quota          = User::MONTHLY_COIN_QUOTA
    quota_progress = quota.positive? ? (total_coins.to_f / quota * 100).round(1) : 0.0
    paced          = (quota * days_elapsed.to_f / days_in_month).round
    on_track       = total_coins >= paced
    pacing_delta   = total_coins - paced

    render json: {
      status: { code: 200, message: "Quota stats retrieved successfully." },
      data: {
        total_coins:         total_coins,
        monthly_coin_quota:  quota,
        quota_progress:      quota_progress,
        paced_monthly_coins: paced,
        on_track:            on_track,
        pacing_delta:        pacing_delta
      }
    }, status: :ok
  end

  private

  def authorize_host!
    authorize_role!(:host)
  end
end
