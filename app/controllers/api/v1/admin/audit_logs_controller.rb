# frozen_string_literal: true

class Api::V1::Admin::AuditLogsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin!

  ALLOWED_TYPES = %w[User Team Session CoinEntry].freeze

  def index
    logs = AuditLog.includes(:actor).order(created_at: :desc)

    logs = logs.where(actor_id: params[:actor_id]) if params[:actor_id].present?
    logs = logs.where(action: params[:action_type]) if params[:action_type].present?
    logs = logs.where(auditable_type: params[:resource_type]) if params[:resource_type].present? && params[:resource_type].in?(ALLOWED_TYPES)
    logs = logs.where("audit_logs.created_at >= ?", Date.parse(params[:date_from]).beginning_of_day) if params[:date_from].present?
    logs = logs.where("audit_logs.created_at <= ?", Date.parse(params[:date_to]).end_of_day) if params[:date_to].present?

    page     = (params[:page].presence || 1).to_i
    per_page = 25
    total    = logs.count
    logs     = logs.offset((page - 1) * per_page).limit(per_page)

    render json: {
      status: { code: 200, message: "Audit logs retrieved successfully." },
      data:   logs.map { |log| serialize_log(log) },
      meta:   { page: page, per_page: per_page, total: total, total_pages: (total.to_f / per_page).ceil }
    }, status: :ok
  end

  private

  def serialize_log(log)
    {
      id:              log.id,
      timestamp:       log.created_at.iso8601,
      actor_id:        log.actor_id,
      actor_name:      log.actor&.name,
      action:          log.action,
      resource_type:   log.auditable_type,
      resource_id:     log.auditable_id,
      resource_label:  log.auditable_label,
      changes:         log.changes_data
    }
  end
end
