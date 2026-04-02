# frozen_string_literal: true

class Api::V1::SessionsController < ApplicationController
  include TeamScoped

  before_action :authenticate_user!
  before_action :authorize_role!
  before_action :set_session, only: [ :show ]

  def index
    sessions = if current_user.admin?
      current_company.sessions
    else
      current_company.sessions.where(team_id: current_teams.pluck(:id))
        .or(current_company.sessions.where(created_by: current_user))
    end

    sessions = sessions.where(team_id: params[:team_id]) if params[:team_id].present?
    sessions = sessions.where(date: params[:date_from]..) if params[:date_from].present?
    sessions = sessions.where(date: ..params[:date_to]) if params[:date_to].present?

    if params[:session_slot].present?
      mapped_slot = params[:session_slot] == "first" ? "slot_one" : "slot_two"
      sessions = sessions.where(session_slot: mapped_slot)
    end

    sessions = sessions.order(date: :desc)

    page     = [ params.fetch(:page, 1).to_i, 1 ].max
    per_page = [ [ params.fetch(:per_page, 15).to_i, 1 ].max, 100 ].min
    total    = sessions.count

    sessions = sessions.offset((page - 1) * per_page).limit(per_page)

    render json: {
      status: { code: 200, message: "Sessions retrieved successfully." },
      data: SessionBlueprint.render_as_hash(sessions),
      meta: {
        page: page,
        per_page: per_page,
        total_count: total,
        total_pages: (total.to_f / per_page).ceil
      }
    }, status: :ok
  end

  def show
    render json: {
      status: { code: 200, message: "Session retrieved successfully." },
      data: SessionBlueprint.render_as_hash(@session)
    }, status: :ok
  end

  def create
    mapped = session_params.to_h.tap do |p|
      p["session_slot"] = p["session_slot"] == "first" ? "slot_one" : "slot_two" if p.key?("session_slot")
    end
    session = current_company.sessions.build(mapped.merge(created_by: current_user))

    if session.save
      assign_hosts(session, params[:host_ids])

      render json: {
        status: { code: 201, message: "Session created successfully." },
        data: SessionBlueprint.render_as_hash(session.reload)
      }, status: :created
    else
      render json: {
        status: { code: 422, message: session.errors.full_messages.join(", ") }
      }, status: :unprocessable_entity
    end
  end

  private

  def authorize_role!
    super(:admin, :emcee)
  end

  def set_session
    @session = Session.find_by(id: params[:id])
    render json: { status: 404, message: "Session not found" }, status: :not_found unless @session
  end

  def session_params
    params.require(:session).permit(:date, :session_slot, :team_id)
  end

  def assign_hosts(session, host_ids)
    return unless host_ids.is_a?(Array) && host_ids.any?

    hosts = User.host.joins(:teams).where(id: host_ids, teams: { id: session.team_id })
    hosts.each do |host|
      session.session_hosts.find_or_create_by(user: host)
    end
  end
end
