# frozen_string_literal: true

module TeamScoped
  extend ActiveSupport::Concern

  private

  def current_teams
    return current_company.teams if current_user.admin?

    return current_user.assigned_teams.where(company_id: current_company.id) if current_user.emcee?

    current_user.teams.where(company_id: current_company.id)
  end

  def authorize_team_access!(team)
    return if current_user.admin?
    return if current_teams.include?(team)

    render json: { status: 403, message: "Forbidden" }, status: :forbidden
  end
end
