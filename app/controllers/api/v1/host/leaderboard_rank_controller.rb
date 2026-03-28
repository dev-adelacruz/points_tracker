# frozen_string_literal: true

class Api::V1::Host::LeaderboardRankController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_role!

  def show
    month_start = Date.current.beginning_of_month

    monthly_totals = CoinEntry
      .joins(:session)
      .where("sessions.date >= ?", month_start)
      .group(:user_id)
      .sum(:coins)

    my_coins = monthly_totals[current_user.id] || 0
    total_hosts = User.host.count
    rank = monthly_totals.count { |_uid, coins| coins > my_coins } + 1

    render json: {
      status: { code: 200, message: "Leaderboard rank retrieved successfully." },
      data: {
        rank: rank,
        total_hosts: total_hosts,
        monthly_coins: my_coins
      }
    }, status: :ok
  end

  private

  def authorize_role!
    super(:host)
  end
end
