# frozen_string_literal: true

class Api::V1::Admin::CompanyQuotaStatsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin!

  def index
    hosts = User.host.where(active: true)

    entries_scope = CoinEntry.joins(:session).where(user_id: hosts.pluck(:id))
    entries_scope = entries_scope.where("sessions.date >= ?", params[:date_from]) if params[:date_from].present?
    entries_scope = entries_scope.where("sessions.date <= ?", params[:date_to]) if params[:date_to].present?

    coins_by_user = entries_scope.group(:user_id).sum(:coins)

    today = Date.current
    days_elapsed = today.day
    total_days = today.end_of_month.day

    company_coin_target = SystemSetting.get("company_coin_target", "300000").to_i

    host_stats = hosts.map do |host|
      total_coins = coins_by_user[host.id] || 0
      quota = host.monthly_coin_quota
      quota_progress = quota > 0 ? (total_coins.to_f / quota * 100).round(1) : 0.0
      paced = days_elapsed > 0 ? ((total_coins.to_f / days_elapsed) * total_days).round : 0
      on_track = quota > 0 ? paced >= quota : nil
      met_quota = quota > 0 && total_coins >= quota

      {
        user_id: host.id,
        email: host.email,
        total_coins: total_coins,
        monthly_coin_quota: quota,
        quota_progress: quota_progress,
        paced_monthly_coins: paced,
        on_track: on_track,
        met_quota: met_quota
      }
    end

    sort_dir = params[:sort] == "asc" ? :asc : :desc
    host_stats = if sort_dir == :asc
      host_stats.sort_by { |h| h[:quota_progress] }
    else
      host_stats.sort_by { |h| -h[:quota_progress] }
    end

    with_quota = host_stats.select { |h| h[:monthly_coin_quota] > 0 }
    summary = {
      total_hosts: host_stats.length,
      on_track_count: with_quota.count { |h| h[:on_track] == true },
      off_track_count: with_quota.count { |h| h[:on_track] == false },
      met_quota_count: with_quota.count { |h| h[:met_quota] },
      company_coin_target: company_coin_target
    }

    render json: {
      status: { code: 200, message: "Company quota stats retrieved successfully." },
      summary: summary,
      data: host_stats
    }, status: :ok
  end
end
