# frozen_string_literal: true

class Api::V1::Reports::EmceePerformancesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin!
  before_action :validate_date_params!

  def show
    start_date = Date.parse(params[:start_date])
    end_date   = Date.parse(params[:end_date])
    date_range = start_date..end_date

    emcees = User.emcee.includes(:assigned_teams)
    data   = emcees.map { |emcee| build_emcee_row(emcee, date_range) }

    render json: {
      status: { code: 200, message: "Emcee performance retrieved successfully." },
      data: data
    }, status: :ok
  end

  private

  def validate_date_params!
    missing = %w[start_date end_date].select { |p| params[p].blank? }

    if missing.any?
      render json: {
        status: { code: 422, message: "Missing required params: #{missing.join(", ")}" }
      }, status: :unprocessable_entity
    end
  end

  def build_emcee_row(emcee, date_range)
    team_ids      = emcee.assigned_teams.pluck(:id)
    sessions      = Session.where(team_id: team_ids, date: date_range)
    sessions_logged = sessions.count

    sessions_with_coins = sessions
      .joins(:coin_entries)
      .distinct
      .count

    completion_pct = sessions_logged.positive? ? (sessions_with_coins.to_f / sessions_logged * 100).round(1) : 0.0

    last_coin_entry_at = CoinEntry
      .joins(:session)
      .where(sessions: { team_id: team_ids })
      .maximum(:updated_at)

    {
      emcee_id:            emcee.id,
      emcee_name:          emcee.name,
      assigned_team_names: emcee.assigned_teams.map(&:name),
      sessions_logged:     sessions_logged,
      sessions_with_coins: sessions_with_coins,
      completion_pct:      completion_pct,
      last_active_at:      last_coin_entry_at&.iso8601
    }
  end
end
