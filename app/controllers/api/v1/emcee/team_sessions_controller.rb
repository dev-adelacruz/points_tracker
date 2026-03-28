# frozen_string_literal: true

class Api::V1::Emcee::TeamSessionsController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_role!

  def index
    team_ids = current_user.teams.pluck(:id)
    sessions = Session
      .includes(:team, coin_entries: :user)
      .where(team_id: team_ids)
    sessions = sessions.where("date >= ?", params[:date_from]) if params[:date_from].present?
    sessions = sessions.where("date <= ?", params[:date_to]) if params[:date_to].present?
    sessions = sessions.order(date: :desc, session_slot: :asc)

    team_member_ids_by_team = TeamMembership
      .where(team_id: team_ids)
      .group_by(&:team_id)
      .transform_values { |memberships| memberships.map(&:user_id).to_set }

    render json: {
      status: { code: 200, message: "Team sessions retrieved successfully." },
      data: sessions.map { |s| serialize_session(s, team_member_ids_by_team[s.team_id] || Set.new) }
    }, status: :ok
  end

  private

  def authorize_role!
    super(:emcee)
  end

  def serialize_session(session, team_member_ids)
    entries = session.coin_entries.sort_by { |e| -e.coins }
    top = entries.first

    {
      id: session.id,
      date: session.date,
      session_slot: session.session_slot == "slot_one" ? "first" : "second",
      team_name: session.team.name,
      total_coins: entries.sum(&:coins),
      top_earner_email: top&.user&.email,
      top_earner_coins: top&.coins,
      host_breakdown: entries.map do |e|
        {
          user_id: e.user_id,
          email: e.user.email,
          coins: e.coins,
          is_guest: !team_member_ids.include?(e.user_id)
        }
      end
    }
  end
end
