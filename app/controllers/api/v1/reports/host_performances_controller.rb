# frozen_string_literal: true

class Api::V1::Reports::HostPerformancesController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin!
  before_action :validate_params!
  before_action :set_host

  def show
    start_date = Date.parse(params[:start_date])
    end_date   = Date.parse(params[:end_date])
    date_range = start_date..end_date

    team_ids   = @host.teams.pluck(:id)
    sessions   = Session.where(team_id: team_ids, date: date_range).order(:date, :session_slot)
    coin_map   = coin_entries_by_session(@host.id, sessions.pluck(:id))

    session_rows = sessions.map do |s|
      coins    = coin_map[s.id] || 0
      attended = coin_map.key?(s.id)
      {
        session_id:   s.id,
        date:         s.date.to_s,
        session_slot: s.session_slot,
        team_id:      s.team_id,
        coins:        coins,
        attended:     attended
      }
    end

    render json: {
      status: { code: 200, message: "Host performance retrieved successfully." },
      data: {
        host_id:       @host.id,
        host_email:    @host.email,
        start_date:    start_date.to_s,
        end_date:      end_date.to_s,
        monthly_total: session_rows.sum { |r| r[:coins] },
        sessions:      session_rows,
        daily_totals:  aggregate_by_day(session_rows),
        weekly_totals: aggregate_by_week(session_rows)
      }
    }, status: :ok
  end

  private

  def validate_params!
    missing = %w[host_id start_date end_date].select { |p| params[p].blank? }

    if missing.any?
      render json: {
        status: { code: 422, message: "Missing required params: #{missing.join(", ")}" }
      }, status: :unprocessable_entity
    end
  end

  def set_host
    @host = User.host.find_by(id: params[:host_id])
    render json: { status: 404, message: "Host not found" }, status: :not_found unless @host
  end

  def coin_entries_by_session(host_id, session_ids)
    CoinEntry
      .where(user_id: host_id, session_id: session_ids)
      .pluck(:session_id, :coins)
      .to_h
  end

  def aggregate_by_day(rows)
    rows
      .group_by { |r| r[:date] }
      .map { |date, r| { date: date, coins: r.sum { |e| e[:coins] } } }
      .sort_by { |r| r[:date] }
  end

  def aggregate_by_week(rows)
    rows
      .group_by { |r| Date.parse(r[:date]).beginning_of_week(:monday).to_s }
      .map { |week_start, r| { week_start: week_start, coins: r.sum { |e| e[:coins] } } }
      .sort_by { |r| r[:week_start] }
  end
end
