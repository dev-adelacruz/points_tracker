# frozen_string_literal: true

class Api::V1::HostsController < ApplicationController
  include HostScoped

  before_action :authenticate_user!
  before_action :authorize_role!
  before_action :require_admin!, only: [ :create, :update, :destroy ]
  before_action :set_host, only: [ :show, :update, :destroy ]
  before_action -> { authorize_host_access!(@host) }, only: [ :show ]

  def index
    hosts = current_company.users.host
    hosts = hosts.joins(:teams).where(teams: { id: params[:team_id] }) if params[:team_id]
    hosts = hosts.where(active: params[:active] == "true") if params.key?(:active)

    render json: {
      status: { code: 200, message: "Hosts retrieved successfully." },
      data: HostBlueprint.render_as_hash(hosts)
    }, status: :ok
  end

  def show
    render json: {
      status: { code: 200, message: "Host retrieved successfully." },
      data: HostBlueprint.render_as_hash(@host)
    }, status: :ok
  end

  def create
    host = current_company.users.build(host_params.merge(role: :host))

    if host.save
      assign_team(host, params[:team_id]) if params[:team_id].present?

      render json: {
        status: { code: 201, message: "Host created successfully." },
        data: HostBlueprint.render_as_hash(host)
      }, status: :created
    else
      render json: {
        status: { code: 422, message: host.errors.full_messages.join(", ") }
      }, status: :unprocessable_entity
    end
  end

  def update
    if @host.update(update_host_params)
      if params.key?(:team_id)
        @host.team_memberships.destroy_all
        assign_team(@host, params[:team_id]) if params[:team_id].present?
      end

      render json: {
        status: { code: 200, message: "Host updated successfully." },
        data: HostBlueprint.render_as_hash(@host.reload)
      }, status: :ok
    else
      render json: {
        status: { code: 422, message: @host.errors.full_messages.join(", ") }
      }, status: :unprocessable_entity
    end
  end

  def destroy
    @host.deactivate!

    render json: {
      status: { code: 200, message: "Host deactivated successfully." },
      data: HostBlueprint.render_as_hash(@host)
    }, status: :ok
  end

  private

  def authorize_role!
    super(:admin, :emcee, :host)
  end

  def require_admin!
    return if current_user.admin?

    render json: { status: 403, message: "Forbidden" }, status: :forbidden
  end

  def set_host
    @host = current_company.users.host.find_by(id: params[:id])
    render json: { status: 404, message: "Host not found" }, status: :not_found unless @host
  end

  def host_params
    params.require(:host).permit(:email, :password)
  end

  def update_host_params
    params.require(:host).permit(:email, :password)
  end

  def assign_team(host, team_id)
    team = Team.find_by(id: team_id)
    host.team_memberships.find_or_create_by(team: team) if team
  end
end
