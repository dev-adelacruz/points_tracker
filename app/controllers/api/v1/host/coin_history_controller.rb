# frozen_string_literal: true

class Api::V1::Host::CoinHistoryController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_role!

  def show
    entries = CoinEntry
      .includes(session: :team)
      .where(user_id: current_user.id)

    entries = entries.where("sessions.date >= ?", params[:date_from]) if params[:date_from].present?
    entries = entries.where("sessions.date <= ?", params[:date_to]) if params[:date_to].present?
    entries = entries.joins(:session).order("sessions.date DESC, sessions.session_slot ASC")

    render json: {
      status: { code: 200, message: "Coin history retrieved successfully." },
      data: HostCoinHistoryBlueprint.render_as_hash(entries)
    }, status: :ok
  end

  private

  def authorize_role!
    super(:host)
  end
end
