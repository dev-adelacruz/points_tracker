# frozen_string_literal: true

class Api::V1::Sessions::CoinEntriesController < ApplicationController
  before_action :authenticate_user!
  before_action :authorize_role!
  before_action :set_session

  def previous_session
    current_slot_value = Session.session_slots[@session.session_slot]
    prev_session = Session
      .where(team_id: @session.team_id)
      .where.not(id: @session.id)
      .where(
        "date < ? OR (date = ? AND session_slot < ?)",
        @session.date, @session.date, current_slot_value
      )
      .order(date: :desc, session_slot: :desc)
      .first

    if prev_session.nil?
      return render json: {
        status: { code: 200, message: "No previous session found." },
        data: [],
        has_previous: false
      }, status: :ok
    end

    entries = prev_session.coin_entries.includes(:user)
    render json: {
      status: { code: 200, message: "Previous session entries retrieved." },
      data: CoinEntryBlueprint.render_as_hash(entries),
      has_previous: true
    }, status: :ok
  end

  def index
    entries = @session.coin_entries.includes(:user).order(:user_id)

    render json: {
      status: { code: 200, message: "Coin entries retrieved successfully." },
      data: CoinEntryBlueprint.render_as_hash(entries)
    }, status: :ok
  end

  def create
    entries_params = params.require(:entries)

    unless entries_params.is_a?(Array)
      return render json: { status: { code: 422, message: "entries must be an array" } }, status: :unprocessable_entity
    end

    errors = []
    saved = []

    entries_params.each do |ep|
      user_id = ep[:user_id].to_i
      coins   = ep[:coins].to_i

      unless @session.hosts.exists?(id: user_id)
        errors << "User #{user_id} is not a host in this session"
        next
      end

      entry = @session.coin_entries.find_or_initialize_by(user_id: user_id)
      entry.coins = coins

      if entry.save
        saved << entry
        HostMailer.coins_logged(entry).deliver_later if entry.user.host? && entry.user.email_notifications_enabled?
      else
        errors << entry.errors.full_messages.join(", ")
      end
    end

    if errors.any?
      render json: {
        status: { code: 422, message: errors.join("; ") }
      }, status: :unprocessable_entity
    else
      render json: {
        status: { code: 201, message: "Coin entries saved successfully." },
        data: CoinEntryBlueprint.render_as_hash(saved)
      }, status: :created
    end
  end

  private

  def authorize_role!
    super(:admin, :emcee)
  end

  def set_session
    @session = Session.find_by(id: params[:session_id])
    return render json: { status: 404, message: "Session not found" }, status: :not_found unless @session

    return if current_user.admin?

    unless current_user.teams.exists?(id: @session.team_id) ||
        current_user.assigned_teams.exists?(id: @session.team_id) ||
        @session.hosts.exists?(id: current_user.id) ||
        @session.created_by_id == current_user.id
      render json: { status: 403, message: "Forbidden" }, status: :forbidden
    end
  end
end
