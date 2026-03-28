# frozen_string_literal: true

class Api::V1::Emcee::TeamHostStatsController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_role!

  def index
    team_ids = current_user.teams.pluck(:id)
    team_id = params[:team_id].to_i

    unless team_ids.include?(team_id)
      render json: { status: { code: 403, message: "You do not have access to this team." } }, status: :forbidden and return
    end

    host_user_ids = TeamMembership
      .joins(:user)
      .where(team_id: team_id, users: { role: :host })
      .pluck(:user_id)

    hosts = User.where(id: host_user_ids)

    entries_scope = CoinEntry.joins(:session).where(user_id: host_user_ids, sessions: { team_id: team_id })
    entries_scope = entries_scope.where("sessions.date >= ?", params[:date_from]) if params[:date_from].present?
    entries_scope = entries_scope.where("sessions.date <= ?", params[:date_to]) if params[:date_to].present?

    coins_by_user = entries_scope.group(:user_id).sum(:coins)
    sessions_by_user = entries_scope.group(:user_id).count

    host_stats = hosts.map do |host|
      total_coins = coins_by_user[host.id] || 0
      quota = host.monthly_coin_quota
      quota_progress = quota > 0 ? (total_coins.to_f / quota * 100).round(1) : 0.0

      {
        user_id: host.id,
        email: host.email,
        total_coins: total_coins,
        monthly_coin_quota: quota,
        quota_progress: quota_progress,
        sessions_attended: sessions_by_user[host.id] || 0
      }
    end.sort_by { |h| -h[:total_coins] }

    render json: {
      status: { code: 200, message: "Team host stats retrieved successfully." },
      data: host_stats
    }, status: :ok
  end

  private

  def authorize_role!
    super(:emcee)
  end
end
