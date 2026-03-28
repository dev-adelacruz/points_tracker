# frozen_string_literal: true

class Api::V1::Host::EarningsSummaryController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_role!

  def show
    base = CoinEntry.joins(:session).where(user_id: current_user.id)
    today = Date.current

    render json: {
      status: { code: 200, message: "Earnings summary retrieved successfully." },
      data: {
        today: base.where("sessions.date = ?", today).sum(:coins),
        this_week: base.where("sessions.date >= ?", today.beginning_of_week).sum(:coins),
        this_month: base.where("sessions.date >= ?", today.beginning_of_month).sum(:coins),
        all_time: base.sum(:coins)
      }
    }, status: :ok
  end

  private

  def authorize_role!
    super(:host)
  end
end
