# frozen_string_literal: true

class Api::V1::LeaderboardController < ApplicationController
  before_action :authenticate_user!

  def index
    per_page = [ [ params[:per_page].to_i, 10 ].max, 100 ].min
    per_page = 50 if per_page.zero?
    page = [ params[:page].to_i, 1 ].max

    host_ids = User.host.where(active: true).pluck(:id)

    entries_scope = CoinEntry.joins(:session).where(user_id: host_ids)
    entries_scope = entries_scope.where("sessions.date >= ?", params[:date_from]) if params[:date_from].present?
    entries_scope = entries_scope.where("sessions.date <= ?", params[:date_to]) if params[:date_to].present?

    coins_by_user = entries_scope.group(:user_id).sum(:coins)
    sessions_by_user = entries_scope.group(:user_id).count

    hosts = User.includes(team_memberships: :team).where(id: host_ids)
    host_map = hosts.index_by(&:id)

    ranked = host_ids.map do |uid|
      total_coins = coins_by_user[uid] || 0
      quota = host_map[uid]&.monthly_coin_quota || 0
      quota_progress = quota > 0 ? (total_coins.to_f / quota * 100).round(1) : 0.0
      {
        user_id: uid,
        email: host_map[uid]&.email,
        team_name: host_map[uid]&.primary_team&.name,
        total_coins: total_coins,
        sessions_count: sessions_by_user[uid] || 0,
        monthly_coin_quota: quota,
        quota_progress: quota_progress
      }
    end.sort_by { |h| -h[:total_coins] }

    ranked.each_with_index { |h, i| h[:rank] = i + 1 }
    ranked.each { |h| h[:is_current_user] = h[:user_id] == current_user.id }

    total_count = ranked.length
    offset = (page - 1) * per_page
    page_data = ranked.slice(offset, per_page) || []

    render json: {
      status: { code: 200, message: "Leaderboard retrieved successfully." },
      data: page_data,
      meta: {
        current_page: page,
        per_page: per_page,
        total_count: total_count,
        total_pages: (total_count.to_f / per_page).ceil
      }
    }, status: :ok
  end
end
