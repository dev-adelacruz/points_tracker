# frozen_string_literal: true

module TeamScoped
  extend ActiveSupport::Concern

  private

  def current_teams
    return Team.all if current_user.admin?

    current_user.teams
  end

  def authorize_team_access!(team)
    return if current_user.admin?
    return if current_teams.include?(team)

    render json: { status: 403, message: "Forbidden" }, status: :forbidden
  end
end
