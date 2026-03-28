# frozen_string_literal: true

class Api::V1::SessionsController < ApplicationController
  include TeamScoped

  before_action :authenticate_user!
  before_action :authorize_role!
  before_action :set_session, only: [ :show, :update, :destroy ]

  def index
    sessions = current_user.admin? ? Session.all : Session.where(team_id: current_user.teams.pluck(:id))
    sessions = sessions.where(team_id: params[:team_id]) if params[:team_id].present?
    sessions = sessions.where(created_by_id: params[:emcee_id]) if params[:emcee_id].present?
    sessions = sessions.where("date >= ?", params[:date_from]) if params[:date_from].present?
    sessions = sessions.where("date <= ?", params[:date_to]) if params[:date_to].present?
    sessions = sessions.order(date: :desc)

    render json: {
      status: { code: 200, message: "Sessions retrieved successfully." },
      data: SessionBlueprint.render_as_hash(sessions)
    }, status: :ok
  end

  def show
    render json: {
      status: { code: 200, message: "Session retrieved successfully." },
      data: SessionBlueprint.render_as_hash(@session)
    }, status: :ok
  end

  def update
    return render json: { status: { code: 403, message: "Forbidden" } }, status: :forbidden unless current_user.admin?

    mapped = update_session_params.to_h.tap do |p|
      p["session_slot"] = p["session_slot"] == "first" ? "slot_one" : "slot_two" if p.key?("session_slot")
    end

    if @session.update(mapped)
      replace_hosts(@session, params[:host_ids]) if params.key?(:host_ids)

      render json: {
        status: { code: 200, message: "Session updated successfully." },
        data: SessionBlueprint.render_as_hash(@session.reload)
      }, status: :ok
    else
      render json: {
        status: { code: 422, message: @session.errors.full_messages.join(", ") }
      }, status: :unprocessable_entity
    end
  end

  def destroy
    return render json: { status: { code: 403, message: "Forbidden" } }, status: :forbidden unless current_user.admin?

    @session.destroy
    render json: {
      status: { code: 200, message: "Session deleted successfully." }
    }, status: :ok
  end

  def create
    mapped = session_params.to_h.tap do |p|
      p["session_slot"] = p["session_slot"] == "first" ? "slot_one" : "slot_two" if p.key?("session_slot")
    end
    session = Session.new(mapped.merge(created_by: current_user))

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

  def update_session_params
    params.require(:session).permit(:date, :session_slot)
  end

  def assign_hosts(session, host_ids)
    return unless host_ids.is_a?(Array) && host_ids.any?

    hosts = User.host.where(id: host_ids)
    hosts.each do |host|
      session.session_hosts.find_or_create_by(user: host)
    end
  end

  def replace_hosts(session, host_ids)
    session.session_hosts.destroy_all
    return unless host_ids.is_a?(Array) && host_ids.any?

    hosts = User.host.where(id: host_ids)
    hosts.each do |host|
      session.session_hosts.create!(user: host)
    end
  end
end
