# frozen_string_literal: true

class Api::V1::Teams::EmceeAssignmentsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin!
  before_action :set_team

  def show
    assignment = @team.current_emcee_assignment

    if assignment
      render json: {
        status: { code: 200, message: "Emcee assignment retrieved successfully." },
        data: assignment_data(assignment)
      }, status: :ok
    else
      render json: { status: { code: 404, message: "No active emcee assignment for this team." } },
        status: :not_found
    end
  end

  def update
    emcee = User.emcee.find_by(id: params[:user_id])

    unless emcee
      render json: { status: { code: 422, message: "User not found or does not have the Emcee role." } },
        status: :unprocessable_entity
      return
    end

    ActiveRecord::Base.transaction do
      @team.current_emcee_assignment&.deactivate!
      @assignment = @team.team_emcee_assignments.create!(user: emcee, active: true)
    end

    render json: {
      status: { code: 200, message: "Emcee assigned successfully." },
      data: assignment_data(@assignment)
    }, status: :ok
  rescue ActiveRecord::RecordInvalid => e
    render json: { status: { code: 422, message: e.message } }, status: :unprocessable_entity
  end

  def destroy
    assignment = @team.current_emcee_assignment

    unless assignment
      render json: { status: { code: 404, message: "No active emcee assignment for this team." } },
        status: :not_found
      return
    end

    assignment.deactivate!

    render json: {
      status: { code: 200, message: "Emcee unassigned successfully." }
    }, status: :ok
  end

  private

  def require_admin!
    return if current_user.admin?

    render json: { status: 403, message: "Forbidden" }, status: :forbidden
  end

  def set_team
    @team = Team.find_by(id: params[:team_id])
    render json: { status: 404, message: "Team not found" }, status: :not_found unless @team
  end

  def assignment_data(assignment)
    {
      team_id: assignment.team_id,
      emcee_id: assignment.user_id,
      emcee_email: assignment.user.email
    }
  end
end
