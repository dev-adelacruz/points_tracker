# frozen_string_literal: true

class Api::V1::Reports::PeriodComparisonsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin!
  before_action :validate_date_params!

  def show
    rows = build_comparison(
      period_a: parsed_range(params[:period_a_start], params[:period_a_end]),
      period_b: parsed_range(params[:period_b_start], params[:period_b_end]),
      scope_type: params[:scope].presence || "all_hosts",
      scope_id: params[:scope_id]
    )

    render json: {
      status: { code: 200, message: "Period comparison retrieved successfully." },
      data: rows
    }, status: :ok
  end

  private

  def validate_date_params!
    required = %w[period_a_start period_a_end period_b_start period_b_end]
    missing = required.select { |p| params[p].blank? }

    if missing.any?
      render json: {
        status: { code: 422, message: "Missing required params: #{missing.join(", ")}" }
      }, status: :unprocessable_entity
    end
  end

  def parsed_range(start_str, end_str)
    Date.parse(start_str)..Date.parse(end_str)
  rescue ArgumentError
    Date.current.beginning_of_month..Date.current
  end

  def build_comparison(period_a:, period_b:, scope_type:, scope_id:)
    scoped_hosts(scope_type, scope_id).map do |host|
      a_total = coins_for(host.id, period_a)
      b_total = coins_for(host.id, period_b)
      delta = b_total - a_total
      delta_pct = a_total.positive? ? (delta.to_f / a_total * 100).round(1) : nil

      {
        entity_type: "host",
        entity_id: host.id,
        entity_name: host.email,
        period_a_total: a_total,
        period_b_total: b_total,
        delta: delta,
        delta_pct: delta_pct
      }
    end
  end

  def scoped_hosts(scope_type, scope_id)
    case scope_type
    when "team"
      User.host.joins(:teams).where(teams: { id: scope_id })
    when "host"
      User.host.where(id: scope_id)
    else
      User.host
    end
  end

  def coins_for(host_id, date_range)
    CoinEntry
      .joins(:session)
      .where(user_id: host_id, sessions: { date: date_range })
      .sum(:coins)
  end
end
