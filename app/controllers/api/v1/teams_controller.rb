# frozen_string_literal: true

class Api::V1::TeamsController < ApplicationController
  include TeamScoped

  before_action :authenticate_user!
  before_action :authorize_role!
  before_action :require_admin!, only: [ :create, :update, :destroy, :reactivate ]
  before_action :set_team, only: [ :update, :destroy, :reactivate ]

  def index
    render json: {
      status: { code: 200, message: "Teams retrieved successfully." },
      data: TeamBlueprint.render_as_hash(current_teams)
    }, status: :ok
  end

  def create
    team = current_company.teams.build(team_params)

    if team.save
      render json: {
        status: { code: 201, message: "Team created successfully." },
        data: TeamBlueprint.render_as_hash(team)
      }, status: :created
    else
      render json: {
        status: { code: 422, message: team.errors.full_messages.join(", ") }
      }, status: :unprocessable_entity
    end
  end

  def update
    if @team.update(team_params)
      render json: {
        status: { code: 200, message: "Team updated successfully." },
        data: TeamBlueprint.render_as_hash(@team)
      }, status: :ok
    else
      render json: {
        status: { code: 422, message: @team.errors.full_messages.join(", ") }
      }, status: :unprocessable_entity
    end
  end

  def destroy
    @team.deactivate!
    render json: {
      status: { code: 200, message: "Team deactivated successfully." },
      data: TeamBlueprint.render_as_hash(@team)
    }, status: :ok
  end

  def reactivate
    @team.reactivate!
    render json: {
      status: { code: 200, message: "Team reactivated successfully." },
      data: TeamBlueprint.render_as_hash(@team)
    }, status: :ok
  end

  private

  def authorize_role!
    super(:admin, :emcee)
  end

  def require_admin!
    return if current_user.admin?

    render json: { status: 403, message: "Forbidden" }, status: :forbidden
  end

  def set_team
    @team = Team.find_by(id: params[:id])
    render json: { status: 404, message: "Team not found" }, status: :not_found unless @team
  end

  def team_params
    params.require(:team).permit(:name, :description)
  end
end
