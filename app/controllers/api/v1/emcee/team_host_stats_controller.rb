# frozen_string_literal: true

class Api::V1::Emcee::TeamHostStatsController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_emcee!
  before_action :set_team

  def index
    date_from = params[:date_from].presence ? Date.parse(params[:date_from]) : Date.current.beginning_of_month
    date_to   = params[:date_to].presence ? Date.parse(params[:date_to]) : Date.current

    hosts = @team.users.host.order(:name)
    session_ids = Session.where(team_id: @team.id, date: date_from..date_to).pluck(:id)

    days_elapsed       = Date.current.day
    days_in_month      = Date.current.end_of_month.day
    at_risk_threshold  = SystemSetting.get("at_risk_threshold_pct", default: "20").to_f

    data = hosts.map do |host|
      total_coins       = CoinEntry.where(user_id: host.id, session_id: session_ids).sum(:coins)
      sessions_attended = CoinEntry.where(user_id: host.id, session_id: session_ids).count
      quota             = User::MONTHLY_COIN_QUOTA
      quota_progress    = quota.positive? ? (total_coins.to_f / quota * 100).round(1) : 0.0
      paced             = (quota * days_elapsed.to_f / days_in_month).round
      on_track          = total_coins >= paced
      at_risk           = paced.positive? && total_coins < (paced * (1 - at_risk_threshold / 100.0))

      {
        user_id:             host.id,
        name:                host.name,
        total_coins:         total_coins,
        monthly_coin_quota:  quota,
        quota_progress:      quota_progress,
        sessions_attended:   sessions_attended,
        paced_monthly_coins: paced,
        on_track:            on_track,
        at_risk:             at_risk
      }
    end

    data.sort_by! { |h| -h[:total_coins] }

    render json: {
      status: { code: 200, message: "Team host stats retrieved successfully." },
      data:   data
    }, status: :ok
  end

  private

  def authorize_emcee!
    authorize_role!(:emcee, :admin)
  end

  def set_team
    teams_scope = current_user.admin? ? current_company.teams : current_user.assigned_teams
    @team = teams_scope.where(company_id: current_company.id).find_by(id: params[:team_id])

    unless @team
      render json: { status: 403, message: "Forbidden" }, status: :forbidden
    end
  end
end
