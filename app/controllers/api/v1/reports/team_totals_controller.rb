# frozen_string_literal: true

class Api::V1::Reports::TeamTotalsController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_role!
  before_action :validate_date_params!

  def show
    teams = scoped_teams
    start_date = Date.parse(params[:start_date])
    end_date = Date.parse(params[:end_date])

    data = teams.map do |team|
      build_team_row(team, start_date..end_date)
    end

    render json: {
      status: { code: 200, message: "Team totals retrieved successfully." },
      data: data
    }, status: :ok
  end

  private

  def authorize_role!
    super(:admin, :emcee)
  end

  def validate_date_params!
    missing = %w[start_date end_date].select { |p| params[p].blank? }

    if missing.any?
      render json: {
        status: { code: 422, message: "Missing required params: #{missing.join(", ")}" }
      }, status: :unprocessable_entity
    end
  end

  def scoped_teams
    if current_user.admin?
      Team.active.includes(:current_emcee, :team_memberships)
    else
      Team.active
        .joins(:team_emcee_assignments)
        .where(team_emcee_assignments: { user_id: current_user.id, active: true })
        .includes(:current_emcee, :team_memberships)
    end
  end

  def build_team_row(team, date_range)
    hosts = team.users.host
    host_count = hosts.count
    total_coins = CoinEntry
      .joins(:session)
      .where(user_id: hosts.select(:id), sessions: { date: date_range, team_id: team.id })
      .sum(:coins)

    avg_coins = host_count.positive? ? (total_coins.to_f / host_count).round(1) : 0.0

    {
      team_id: team.id,
      team_name: team.name,
      emcee_email: team.current_emcee&.email,
      total_coins: total_coins,
      host_count: host_count,
      avg_coins_per_host: avg_coins
    }
  end
end
